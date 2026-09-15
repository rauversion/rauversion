json.cart do
  json.id @cart.id
  json.total_items @cart.product_items.sum(:quantity)
  cart_currency = @cart.product_items.includes(:product).map { |item| item.product.currency }.compact.uniq
  json.currency cart_currency.one? ? cart_currency.first : nil
  json.total_price cart_currency.one? ? formatted_product_price(@cart.total_price, cart_currency.first) : @cart.total_price
  json.items @cart.product_items do |item|
    json.id item.id
    json.quantity item.quantity
    json.price item.price
    json.currency item.product.currency
    json.formatted_price formatted_product_price(item.price, item.product.currency)
    json.product do
      json.id item.product.id
      json.title item.product.title
      json.description item.product.description
      json.price item.product.price
      json.currency item.product.currency
      json.formatted_price formatted_product_price(item.product.price, item.product.currency)
      json.cover_url do
        json.small item.product.cover_url(:small) if item.product.cover_url(:small)
        json.medium item.product.cover_url(:medium) if item.product.cover_url(:medium)
        json.large item.product.cover_url(:large) if item.product.cover_url(:large)
      end
    end
  end
end
