class EventReportsController < ApplicationController
  REPORT_STATES = %w[paid invitation pending refunded].freeze

  before_action :authenticate_user!
  before_action :set_event
  before_action :authorize_manager!

  # GET /events/:event_id/reports/:id
  # id can be: general_stats, orders_distribution, revenue_over_time, etc.
  def show
    case params[:id]
    when 'general_stats'
      render json: general_stats
    when 'orders_distribution'
      render json: orders_distribution
    when 'revenue_over_time'
      render json: revenue_over_time
    else
      render json: { error: 'Report type not found' }, status: :not_found
    end
  end

  private

  def set_event
    @event = Event.for_tenant.find_by(slug: params[:event_id])
    return if @event

    @event = Event.for_tenant.find_by(id: params[:event_id]) if params[:event_id].to_s.match?(/\A\d+\z/)
    raise ActiveRecord::RecordNotFound, "Couldn't find Event" unless @event
  end

  def authorize_manager!
    return if @event.can_access_reports?(current_user)

    render json: { error: 'Unauthorized' }, status: :unauthorized
  end

  def general_stats
    purchased_items = @event.purchased_items
    stats_by_state = purchased_items.group(report_state).pluck(report_state, item_count, item_total)
      .to_h { |state, count, total| [state, { count: count.to_i, total: total.to_f }] }

    status_stats = REPORT_STATES.index_with { |state| stats_by_state.fetch(state, { count: 0, total: 0.0 }) }
    status_stats.merge(
      ticket_types: ticket_type_stats(purchased_items),
      event: {
        title: @event.title,
        event_start: @event.event_start,
        event_ends: @event.event_ends,
        currency: @event.ticket_currency || 'usd'
      }
    )
  end

  def report_state
    invitation_ids = @event.purchases.merge(Purchase.event_invitations).select(:id).to_sql
    @report_state ||= Arel.sql(<<~SQL.squish)
      CASE WHEN purchased_items.state = 'paid' AND purchased_items.purchase_id IN (#{invitation_ids})
      THEN 'invitation' ELSE purchased_items.state END
    SQL
  end

  def item_count
    Arel.sql("COUNT(purchased_items.id)")
  end

  def item_total
    Arel.sql("COALESCE(SUM(purchased_items.price), 0)")
  end

  def ticket_type_stats(purchased_items)
    stats_by_ticket = Hash.new { |stats, ticket_id| stats[ticket_id] = {} }

    purchased_items
      .where(purchased_item_type: "EventTicket")
      .group(:purchased_item_id, report_state)
      .pluck(:purchased_item_id, report_state, item_count, item_total)
      .each do |ticket_id, state, count, total|
        stats_by_ticket[ticket_id][state] = { count: count.to_i, total: total.to_f }
      end

    reserved_by_ticket = purchased_items
      .where(purchased_item_type: "EventTicket", state: "pending")
      .where("purchased_items.created_at >= ?", Time.current - Purchase::PENDING_RESERVATION_TTL)
      .group(:purchased_item_id)
      .count

    EventTicket.with_deleted
      .where(event_id: @event.id)
      .order(:position, :id)
      .map do |ticket|
        status_stats = REPORT_STATES.index_with do |state|
          stats_by_ticket.dig(ticket.id, state) || { count: 0, total: 0.0 }
        end
        sold = status_stats["paid"][:count]
        invited = status_stats["invitation"][:count]
        remaining = ticket.deleted? ? 0 : [ticket.qty.to_i, 0].max
        total_quantity = sold + invited + remaining
        available_quantity = [remaining - reserved_by_ticket.fetch(ticket.id, 0), 0].max

        {
          id: ticket.id,
          title: ticket.title,
          count: sold,
          revenue: status_stats["paid"][:total],
          available_quantity: available_quantity,
          total_quantity: total_quantity,
          sales_percentage: total_quantity.positive? ? (sold.fdiv(total_quantity) * 100).round(1) : 0.0,
          paid: status_stats["paid"],
          invitation: status_stats["invitation"],
          pending: status_stats["pending"],
          refunded: status_stats["refunded"]
        }
      end
  end

  def orders_distribution
    purchased_items = @event.purchased_items
    
    total = purchased_items.count
    
    distribution = purchased_items.group(report_state).count
    
    {
      total: total,
      distribution: distribution,
      percentages: distribution.transform_values { |count| total > 0 ? ((count.to_f / total) * 100).round(2) : 0 }
    }
  end

  def revenue_over_time
    # Get date range - default to last 30 days or since event creation
    start_date = params[:start_date]&.to_date || [@event.created_at.to_date, 30.days.ago.to_date].max
    end_date = params[:end_date]&.to_date || Date.today

    purchased_items = @event.purchased_items.where(state: "paid", created_at: start_date.beginning_of_day..end_date.end_of_day)

    # Group by day
    daily_revenue = purchased_items
      .group_by_day(:created_at, range: start_date..end_date)
      .sum(:price)

    # Also get count by day
    daily_orders = purchased_items
      .group_by_day(:created_at, range: start_date..end_date)
      .count

    {
      start_date: start_date,
      end_date: end_date,
      daily_revenue: daily_revenue.transform_keys { |k| k.strftime('%Y-%m-%d') },
      daily_orders: daily_orders.transform_keys { |k| k.strftime('%Y-%m-%d') },
      total_revenue: purchased_items.sum(:price).to_f,
      total_orders: purchased_items.count
    }
  end
end
