class Event < ApplicationRecord
  belongs_to :user

  has_many :event_hosts
  has_many :event_schedules
  has_many :event_recordings
  has_many :schedule_schedulings, through: :event_schedules
  has_many :event_tickets
  has_many :purchases, as: :purchasable
  has_many :purchased_items, through: :purchases
  has_many :paid_purchased_items, -> {
    where(state: "paid")
  }, through: :purchases, class_name: "PurchasedItem", source: :purchased_items
  has_many :purchased_event_tickets, -> {
    where(purchased_items: {purchased_item_type: "EventTicket"})
  }, through: :purchased_items, source: :purchased_item, source_type: "EventTicket"

  def self.ransackable_attributes(auth_object = nil)
    ["age_requirement", "attendee_list_settings", "city", "country", "created_at", "description", "eticket", "event_capacity", "event_capacity_limit", "event_ends", "event_settings", "event_short_link", "event_start", "id", "lat", "lng", "location", "online", "order_form", "postal", "private", "province", "scheduling_settings", "slug", "state", "streaming_service", "street", "street_number", "tax_rates_settings", "tickets", "timezone", "title", "updated_at", "user_id", "venue", "widget_button", "will_call"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["cover_attachment", "cover_blob", "event_hosts", "event_recordings", "event_schedules", "event_tickets", "paid_purchased_items", "purchased_event_tickets", "purchased_items", "purchases", "schedule_schedulings", "user"]
  end

  scope :upcoming, -> { where('event_start >= ?', Time.current).order(event_start: :asc) }
  scope :past, -> { where('event_start < ?', Time.current).order(event_start: :desc) }
  scope :published, -> { where(state: 'published') }

  # has_many :paid_tickets,

  has_one_attached :cover

  extend FriendlyId
  friendly_id :title, use: :slugged

  accepts_nested_attributes_for :event_hosts, allow_destroy: true
  accepts_nested_attributes_for :event_schedules, allow_destroy: true
  accepts_nested_attributes_for :event_tickets, allow_destroy: true
  accepts_nested_attributes_for :event_recordings, allow_destroy: true

  store_accessor :event_settings, :participant_label, :string, default: "speakers"
  store_accessor :event_settings, :participant_description, :string
  store_accessor :event_settings, :accept_sponsors, :boolean
  store_accessor :event_settings, :sponsors_label, :string
  store_accessor :event_settings, :sponsors_description, :string
  store_accessor :event_settings, :public_streaming, :boolean
  store_accessor :event_settings, :payment_gateway, :string
  store_accessor :event_settings, :scheduling_label, :string
  store_accessor :event_settings, :scheduling_description, :string
  store_accessor :event_settings, :ticket_currency, :string
  store_accessor :event_settings, :hide_location_until_purchase, :boolean

  scope :drafts, -> { where(state: "draft") }
  scope :managers, -> { where(event_manager: true) }
  # Ex:- scope :active, -> {where(:active => true)}

  scope :public_events, -> {
    # where(private: false)
    where(state: "published")
  }

  scope :upcoming_events, -> {
    public_events.where("event_start >= ?", Time.now)
      .order(event_start: :asc)
  }

  scope :past_events, -> {
    public_events.where("event_start <= ?", Time.now)
      .order(event_start: :desc)
  }

  include AASM
  aasm column: :state do
    state :draft, initial: true
    state :published

    event :run do
      transitions from: :draft, to: :published
    end
  end

  def streaming_service
    self[:streaming_service] || {}
  end

  def available_tickets(argument = nil)
    # Filter available tickets honoring per-ticket "show_*" settings stored on EventTicket#settings:
    #  - hidden               (don't show when true)
    #  - show_after_sold_out  (if true, include even when qty <= 0)
    #  - show_sell_until      (if false, ignore selling_end and show even after selling_end)
    #
    # `argument` is the reference time (usually Time.current). If nil, use Time.current.
    at_time = argument || Time.current

    # Start with tickets whose selling has started
    tickets = event_tickets.where("selling_start <= ?", at_time)

    # Filter in Ruby because settings are stored via store_accessor (may be nil/boolean)
    tickets.to_a.select do |t|
      # Skip explicitly hidden tickets
      next false if t.respond_to?(:hidden) && t.hidden == true

      # selling_end handling: if show_sell_until == false, ignore selling_end
      selling_ok = if t.respond_to?(:show_sell_until) && t.show_sell_until == false
        true
      else
        t.selling_end.nil? || t.selling_end >= at_time
      end

      # Quantity handling: include if qty > 0 OR show_after_sold_out enabled
      qty_ok = t.qty.to_i > 0 || (t.respond_to?(:show_after_sold_out) && t.show_after_sold_out == true)

      selling_ok && qty_ok
    end
  end

  def self.format_date_range(start_date, end_date)
    return if end_date.nil?
    # If end_date is nil or same as start_date, just show start_date
    if end_date.nil? || start_date.to_date == end_date.to_date
      I18n.l(start_date, format: :day_with_year)
    else
      # If end_date exists and is different from start_date, show range
      "#{I18n.l(start_date, format: :day)} to #{I18n.l(end_date, format: :day_with_year)}"
    end
  end

  def presicion_for_currency
    0
  end

  def toggle_published!
    new_state = (state == "published") ? "draft" : "published"
    update(state: new_state)
  end

  def event_dates
    self.class.format_date_range(event_start, event_ends)
  end

  def cover_url(size = nil)
    url = case size
    when :medium
      cover.variant(resize_to_limit: [200, 200])&.processed&.url

    when :large
      cover.variant(resize_to_limit: [500, 500])&.processed&.url

    when :small
      cover.variant(resize_to_limit: [50, 50])&.processed&.url

    else
      cover.variant(resize_to_limit: [200, 200])&.processed&.url
    end

    url || AlbumsHelper.default_image_sqr
  end

  def sales_count
    purchased_event_tickets
      .where("purchased_items.state =?", "paid").sum("price")
  end

  def tickets_sold
    paid_purchased_items.size
  end

  def has_transbank?
    self.user.tbk_commerce_code.present?
  end

  def has_stripe?
    self.user.stripe_account_id # oauth_credentials.where(provider: "stripe_connect").present?
  end

  def secret_ticket_url(ticket)
    # Generate a secret URL for a hidden ticket
    Rails.application.routes.url_helpers.event_url(
      self,
      ticket_token: ticket.signed_id(expires_in: 30.days, purpose: :secret_purchase)
    )
  end
end
