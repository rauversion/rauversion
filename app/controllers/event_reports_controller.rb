class EventReportsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :authorize_event_owner!

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
    @event = Event.find_by!(slug: params[:event_id])
  end

  def authorize_event_owner!
    unless @event.user_id == current_user.id
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def general_stats
    purchased_items = @event.purchased_items

    paid_items = purchased_items.where(state: 'paid')
    pending_items = purchased_items.where(state: 'pending')
    refunded_items = purchased_items.where(state: 'refunded')

    {
      paid: {
        count: paid_items.count,
        total: paid_items.sum(:price).to_f
      },
      pending: {
        count: pending_items.count,
        total: pending_items.sum(:price).to_f
      },
      refunded: {
        count: refunded_items.count,
        total: refunded_items.sum(:price).to_f
      },
      event: {
        title: @event.title,
        event_start: @event.event_start,
        event_ends: @event.event_ends,
        currency: @event.ticket_currency || 'usd'
      }
    }
  end

  def orders_distribution
    purchased_items = @event.purchased_items
    
    total = purchased_items.count
    
    distribution = purchased_items.group(:state).count
    
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

    purchased_items = @event.purchased_items.where(created_at: start_date.beginning_of_day..end_date.end_of_day)

    # Group by day
    daily_revenue = purchased_items
      .where(state: ['paid', 'pending'])
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
      total_revenue: purchased_items.where(state: ['paid', 'pending']).sum(:price).to_f,
      total_orders: purchased_items.count
    }
  end
end
