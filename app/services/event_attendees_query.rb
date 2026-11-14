class EventAttendeesQuery
  def initialize(event:, filters: {})
    @event = event
    @filters = filters.to_h.stringify_keys
  end

  def call
    items = @event.purchased_items.includes(purchase: :user).order(created_at: :desc)

    query = @filters['query'].to_s.strip
    if query.present?
      pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
      items = items.left_joins(purchase: :user).where(<<~SQL.squish, query: pattern)
        users.display_name ILIKE :query
        OR users.username ILIKE :query
        OR CONCAT_WS(' ', users.first_name, users.last_name) ILIKE :query
        OR users.email ILIKE :query
        OR purchases.guest_email ILIKE :query
      SQL
    end

    status = @filters['status']
    case status
    when 'invitation'
      items = items.where(state: 'paid', purchase_id: Purchase.event_invitations.select(:id))
    when 'paid'
      items = items.where(state: 'paid').where.not(purchase_id: Purchase.event_invitations.select(:id))
    when 'pending', 'refunded'
      items = items.where(state: status)
    end

    case @filters['checked_in']
    when 'true'
      items = items.where(checked_in: true)
    when 'false'
      items = items.where(checked_in: [false, nil])
    end

    items
  end
end
