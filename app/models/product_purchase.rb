class ProductPurchase < ApplicationRecord
  belongs_to :user
  has_many :product_purchase_items, dependent: :destroy
  has_many :products, through: :product_purchase_items

  validates :tracking_code, presence: true, if: -> { shipped? || delivered? }
  validates :payment_intent_id, presence: true, if: :completed?

  store_accessor :shipping_address, :line1, :line2, :city, :state, :postal_code, :country

  scope :for_seller, ->(user) {
    joins(product_purchase_items: :product)
      .where(products: { user_id: user.seller_account_ids })
      .distinct
  }
  
  def total_with_shipping
    total_amount + shipping_cost.to_f
  end

  enum :status, {
    pending: 'pending',
    completed: 'completed',
    order_placed: 'order_placed',
    refunded: 'refunded',
    failed: 'failed'
  }

  enum :shipping_status, {
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered'
  }

  def can_refund?
    completed? || shipped? || delivered?
  end

  def total_quantity
    product_purchase_items.sum(&:quantity)
  end

end