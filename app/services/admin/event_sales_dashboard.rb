module Admin
  class EventSalesDashboard
    DEFAULT_RANGE_DAYS = 30
    TOP_LIMIT = 8
    TICKET_LIMIT = 12
    PURCHASES_JOIN = "INNER JOIN purchases ON purchases.id = purchased_items.purchase_id AND purchases.purchasable_type = 'Event'".freeze
    EVENTS_JOIN = "INNER JOIN events ON events.id = purchases.purchasable_id".freeze
    TICKETS_JOIN = "LEFT JOIN event_tickets ON event_tickets.id = purchased_items.purchased_item_id".freeze
    ORGANIZERS_JOIN = "LEFT JOIN users organizers ON organizers.id = events.user_id".freeze
    ORGANIZER_NAME_SQL = "COALESCE(NULLIF(organizers.display_name, ''), organizers.username, organizers.email)".freeze

    def initialize(scope: PurchasedItem.where(purchased_item_type: "EventTicket"), from: nil, to: nil)
      @scope = scope
      @from = from
      @to = to
    end

    def as_json(*)
      {
        range: range,
        summary: summary,
        paid_revenue_by_currency: money_stats(paid_ticket_items.group(:currency).sum(:price)),
        refunded_revenue_by_currency: money_stats(refunded_ticket_items.group(:currency).sum(:price)),
        top_events: top_events,
        top_ticket_types: top_ticket_types
      }
    end

    private

    attr_reader :scope

    def range
      {
        from: from_date.iso8601,
        to: to_date.iso8601,
        days: (to_date - from_date).to_i + 1
      }
    end

    def summary
      {
        sold_tickets: paid_ticket_items.count,
        remaining_tickets: remaining_tickets_total,
        refunded_tickets: refunded_ticket_items.count,
        events_with_sales: paid_ticket_items.distinct.count("events.id"),
        latest_sale_at: paid_ticket_items.maximum("purchased_items.created_at")
      }
    end

    def top_events
      refunded_by_event = refunded_ticket_items.group("events.id").count
      remaining_by_event = remaining_tickets_by_event

      paid_ticket_items
        .joins(ORGANIZERS_JOIN)
        .select(
          "events.id AS event_id",
          "events.title AS event_title",
          "events.slug AS event_slug",
          "events.state AS event_state",
          "events.visibility AS event_visibility",
          "events.event_start AS event_start",
          "#{ORGANIZER_NAME_SQL} AS organizer_name",
          "organizers.username AS organizer_username",
          "purchased_items.currency AS currency",
          "COUNT(purchased_items.id) AS sold_tickets",
          "SUM(COALESCE(purchased_items.price, 0)) AS revenue"
        )
        .group(
          "events.id",
          "events.title",
          "events.slug",
          "events.state",
          "events.visibility",
          "events.event_start",
          "organizers.username",
          "organizers.display_name",
          "organizers.email",
          "purchased_items.currency"
        )
        .order(Arel.sql("sold_tickets DESC, revenue DESC"))
        .limit(TOP_LIMIT)
        .map do |row|
          {
            id: row.event_id,
            title: row.event_title,
            state: row.event_state,
            visibility: row.event_visibility,
            event_start: row.event_start,
            sold_tickets: row.sold_tickets.to_i,
            remaining_tickets: remaining_by_event[row.event_id].to_i,
            refunded_tickets: refunded_by_event[row.event_id].to_i,
            currency: normalize_currency(row.currency),
            revenue: row.revenue.to_d,
            organizer_name: row.organizer_name,
            organizer_username: row.organizer_username,
            organizer_path: row.organizer_username.present? ? routes.user_path(row.organizer_username) : nil,
            event_path: event_path_for(
              slug: row.event_slug,
              id: row.event_id,
              state: row.event_state,
              visibility: row.event_visibility
            )
          }
        end
    end

    def top_ticket_types
      refunded_by_ticket = refunded_ticket_items.group("purchased_items.purchased_item_id").count
      remaining_by_ticket = remaining_tickets_by_ticket

      paid_ticket_items
        .joins(TICKETS_JOIN)
        .select(
          "event_tickets.id AS ticket_id",
          "event_tickets.title AS ticket_title",
          "event_tickets.qty AS remaining_tickets",
          "event_tickets.deleted_at AS ticket_deleted_at",
          "events.id AS event_id",
          "events.title AS event_title",
          "events.slug AS event_slug",
          "events.state AS event_state",
          "events.visibility AS event_visibility",
          "purchased_items.currency AS currency",
          "COUNT(purchased_items.id) AS sold_tickets",
          "SUM(COALESCE(purchased_items.price, 0)) AS revenue"
        )
        .group(
          "event_tickets.id",
          "event_tickets.title",
          "event_tickets.qty",
          "event_tickets.deleted_at",
          "events.id",
          "events.title",
          "events.slug",
          "events.state",
          "events.visibility",
          "purchased_items.currency"
        )
        .order(Arel.sql("sold_tickets DESC, revenue DESC"))
        .limit(TICKET_LIMIT)
        .map do |row|
          {
            id: row.ticket_id,
            title: row.ticket_title.presence || "Deleted ticket ##{row.ticket_id}",
            sold_tickets: row.sold_tickets.to_i,
            remaining_tickets: remaining_by_ticket.key?(row.ticket_id) ? remaining_by_ticket[row.ticket_id] : row.remaining_tickets.to_i,
            refunded_tickets: refunded_by_ticket[row.ticket_id].to_i,
            currency: normalize_currency(row.currency),
            revenue: row.revenue.to_d,
            event_title: row.event_title,
            archived: row.ticket_deleted_at.present?,
            event_path: event_path_for(
              slug: row.event_slug,
              id: row.event_id,
              state: row.event_state,
              visibility: row.event_visibility
            )
          }
        end
    end

    def paid_ticket_items
      @paid_ticket_items ||= filtered_ticket_items.where(state: "paid")
    end

    def refunded_ticket_items
      @refunded_ticket_items ||= filtered_ticket_items.where(state: "refunded")
    end

    def ticket_items
      @ticket_items ||= scope.joins(PURCHASES_JOIN).joins(EVENTS_JOIN)
    end

    def filtered_ticket_items
      @filtered_ticket_items ||= ticket_items.where(purchased_items: { created_at: from_date.beginning_of_day..to_date.end_of_day })
    end

    def ticket_items_after_range
      @ticket_items_after_range ||= ticket_items.where("purchased_items.created_at > ?", to_date.end_of_day)
    end

    def paid_ticket_items_after_range
      @paid_ticket_items_after_range ||= ticket_items_after_range.where(state: "paid")
    end

    def refunded_ticket_items_after_range
      @refunded_ticket_items_after_range ||= ticket_items_after_range.where(state: "refunded")
    end

    def remaining_tickets_total
      event_tickets_scope.sum(:qty).to_i +
        paid_ticket_items_after_range.count -
        refunded_ticket_items_after_range.count
    end

    def remaining_tickets_by_event
      current = event_tickets_scope.group(:event_id).sum(:qty)
      paid_after = paid_ticket_items_after_range.group("events.id").count
      refunded_after = refunded_ticket_items_after_range.group("events.id").count

      merge_remaining_counts(current, paid_after, refunded_after)
    end

    def remaining_tickets_by_ticket
      current = event_tickets_scope.group(:id).sum(:qty)
      paid_after = paid_ticket_items_after_range.group("purchased_items.purchased_item_id").count
      refunded_after = refunded_ticket_items_after_range.group("purchased_items.purchased_item_id").count

      merge_remaining_counts(current, paid_after, refunded_after)
    end

    def merge_remaining_counts(current, paid_after, refunded_after)
      keys = current.keys | paid_after.keys | refunded_after.keys

      keys.each_with_object({}) do |key, memo|
        memo[key] = current[key].to_i + paid_after[key].to_i - refunded_after[key].to_i
      end
    end

    def money_stats(stats_hash)
      stats_hash
        .map do |currency, amount|
          {
            currency: normalize_currency(currency),
            amount: amount.to_d
          }
        end
        .sort_by { |entry| -entry[:amount] }
    end

    def normalize_currency(currency)
      currency.present? ? currency.to_s.upcase : "USD"
    end

    def routes
      Rails.application.routes.url_helpers
    end

    def event_tickets_scope
      @event_tickets_scope ||= EventTicket.respond_to?(:with_deleted) ? EventTicket.with_deleted : EventTicket.unscoped
    end

    def from_date
      @from_date ||= normalized_range.first
    end

    def to_date
      @to_date ||= normalized_range.last
    end

    def normalized_range
      @normalized_range ||= begin
        default_to = parse_date(@to) || Time.zone.today
        default_from = parse_date(@from) || (default_to - (DEFAULT_RANGE_DAYS - 1).days)
        [default_from, default_to].minmax
      end
    end

    def parse_date(value)
      return nil if value.blank?

      Date.iso8601(value)
    rescue ArgumentError
      nil
    end

    def event_path_for(slug:, id:, state:, visibility:)
      return nil if state != "published" || visibility == "private"

      routes.event_path(slug.presence || id)
    end
  end
end
