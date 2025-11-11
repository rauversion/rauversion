class EventTicket < ApplicationRecord
  acts_as_paranoid

  belongs_to :event

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
  store_accessor :settings, :sales_channel, :string
  store_accessor :settings, :after_purchase_message, :string
  store_accessor :settings, :pay_what_you_want, :boolean
  store_accessor :settings, :minimum_price, :decimal

  validates :title, presence: true
  validates :price, presence: true
  validates :qty, presence: true
  # validates :selling_start, presence: true
  # validates :selling_end, presence: true
  validates :short_description, presence: true
  validate :selling_start_before_selling_end
  validate :minimum_price_present_if_pwyw

  def free?
    price.to_i == 0
  end

  def pay_what_you_want?
    pay_what_you_want == true
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
  # scope :purchased_tickets, -> { where(:attibute => value)}
  # Ex:- scope :active, -> {where(:active => true)}
end
