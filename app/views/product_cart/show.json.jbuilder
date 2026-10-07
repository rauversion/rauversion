json.cart do
  json.id @cart.id
  #json.total_items @cart.product_items.sum(:quantity)
  cart_currency = @cart.product_cart_items.includes(:product).map { |item| item.product.currency }.compact.uniq
  json.currency cart_currency.one? ? cart_currency.first : nil
  json.total_price cart_currency.one? ? formatted_product_price(@cart.total_price, cart_currency.first) : @cart.total_price

  shipping_costs = @cart.shipping_costs_by_country
  json.shipping_country_required ENV["DEFAULT_PAYMENT_GATEWAY"] != "mercado_pago" && shipping_costs.values.uniq.size > 1
  json.shipping_options shipping_costs do |country, amount|
    json.country country
    json.formatted_amount formatted_product_price(amount, cart_currency.first)
  end

  json.items @cart_items do |item|
    
      json.product do
      json.id item.id
      json.quantity item.quantity
      # json.price item.price
      json.total_price formatted_product_price(item.total_price, item.product.currency)
      
        product = item.product
        json.id product.id
        json.title product.title
        json.description product.description
        json.price product.price
        json.currency product.currency
        json.formatted_price formatted_product_price(product.price, product.currency)
        json.slug product.slug
        
        json.user do
          json.partial! 'users/user', user: product.user, show_full_name: true
        end
        
        json.images product.product_images do |image|
          json.small image.image_url(:small) if image.image_url(:small)
          json.medium image.image_url(:medium) if image.image_url(:medium)
          json.large image.image_url(:large) if image.image_url(:large)
        end
    
        
        json.created_at product.created_at
        json.updated_at product.updated_at
      
    end
  end
end
