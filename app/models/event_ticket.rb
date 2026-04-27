class EventTicket < ApplicationRecord
  acts_as_paranoid

  belongs_to :event
  belongs_to :event_list, optional: true

  has_many :purchased_items, as: :purchased_item

  has_many :purchased_tickets, -> { where(purchased_item_type: "EventTicket") }, class_name: "PurchasedItem", as: :purchased_tickets
  has_many :paid_tickets, -> { where(purchased_item_type: "EventTicket", paid: true) }, class_name: "PurchasedItem", as: :paid_tickets

  # has_many :pending_comments, -> { where(state: 'pending') }, class_name: 'Comment', as: :commentable

  store_accessor :settings, :show_sell_until, :boolean
  store_accessor :settings, :show_after_sold_out, :boolean
  store_accessor :settings, :fee_type, :string
  store_accessor :settings, :hidden, :boolean
  store_accessor :settings, :max_tickets_per_order, :integer
  store_accessor :settings, :min_tickets_per_order, :integer
  store_accessor :settings, :max_tickets_per_user, :integer
  store_accessor :settings, :sales_channel, :string
  store_accessor :settings, :after_purchase_message, :string
  store_accessor :settings, :pay_what_you_want, :boolean
  store_accessor :settings, :minimum_price, :decimal
  store_accessor :settings, :suggested_price, :decimal
  store_accessor :settings, :disable_qr, :boolean
  store_accessor :settings, :requires_shipping, :boolean
  store_accessor :settings, :show_remaining_count, :boolean
  store_accessor :settings, :requires_login, :boolean

  validates :title, presence: true
  validates :price, presence: true
  validates :qty, presence: true
  # validates :selling_start, presence: true
  # validates :selling_end, presence: true
  validates :short_description, presence: true
  validate :selling_start_before_selling_end
  validate :minimum_price_present_if_pwyw
  validate :suggested_price_valid

  def free?
    price.to_i == 0
  end

  def pay_what_you_want?
    pay_what_you_want == true
  end

  def can_redeem_with_email?(email)
    return true if event_list_id.blank?
    return false if email.blank?
    event_list.has_email?(email)
  end

  def active_pending_purchased_items(ttl: Purchase::PENDING_RESERVATION_TTL, excluding_purchase: nil)
    scope = purchased_items.where(state: "pending")
    scope = scope.where("purchased_items.created_at >= ?", Time.current - ttl) if ttl.present?
    scope = scope.where.not(purchase_id: excluding_purchase.id) if excluding_purchase&.persisted?
    scope
  end

  def active_pending_quantity(ttl: Purchase::PENDING_RESERVATION_TTL, excluding_purchase: nil)
    active_pending_purchased_items(ttl: ttl, excluding_purchase: excluding_purchase).count
  end

  def available_quantity(ttl: Purchase::PENDING_RESERVATION_TTL, excluding_purchase: nil)
    [qty.to_i - active_pending_quantity(ttl: ttl, excluding_purchase: excluding_purchase), 0].max
  end

  private

  def selling_start_before_selling_end
    return if selling_start.blank? || selling_end.blank?

    if selling_start >= selling_end
      errors.add(:selling_start, "must be before selling end")
    end
  end

  def minimum_price_present_if_pwyw
    return unless pay_what_you_want?

    if minimum_price.blank? || minimum_price.to_f < 0
      errors.add(:minimum_price, "must be present and non-negative when pay what you want is enabled")
    end
  end

  def suggested_price_valid
    return if suggested_price.blank?

    if suggested_price.to_f < 0
      errors.add(:suggested_price, "must be non-negative")
      return
    end

    return unless pay_what_you_want? && minimum_price.present?
    return if suggested_price.to_f >= minimum_price.to_f

    errors.add(:suggested_price, "must be greater than or equal to minimum price")
  end
  # scope :purchased_tickets, -> { where(:attibute => value)}
  # Ex:- scope :active, -> {where(:active => true)}
end
