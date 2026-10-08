class ProductCart < ApplicationRecord
  belongs_to :user, optional: true
  has_many :product_cart_items, dependent: :destroy
  has_many :products, through: :product_cart_items

  def add_product(product, quantity = 1)
    current_item = product_cart_items.find_by(product: product)
    if current_item
      current_item.quantity += quantity
    else
      current_item = product_cart_items.build(product: product, quantity: quantity)
    end
    current_item.save
  end

  def total_price
    product_cart_items.sum { |item| item.total_price }
  end

  def shipping_costs_by_country
    product_cart_items.includes(product: :product_shippings).each_with_object({}) do |item, totals|
      item.product.product_shippings.each do |shipping|
        cost = shipping.base_cost.to_d + (item.quantity - 1) * shipping.additional_cost.to_d
        totals[shipping.country] = totals.fetch(shipping.country, 0.to_d) + cost
      end
    end
  end

  def pickup_available?
    items = product_cart_items.includes(product: :product_shippings).to_a
    items.any? && items.all? { |item| item.product.allow_pickup? }
  end

  def requires_pickup?
    product_cart_items.includes(product: :product_shippings).any? do |item|
      item.product.is_a?(Products::PhysicalProduct) && item.product.product_shippings.empty?
    end
  end
end
