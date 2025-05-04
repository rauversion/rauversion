json.cart do
  json.id @cart.id
  #json.total_items @cart.product_items.sum(:quantity)
  json.total_price number_to_currency(@cart.total_price)

  json.items @cart_items do |item|
    
      json.product do
      json.id item.id
      json.quantity item.quantity
      # json.price item.price
      json.total_price number_to_currency(item.total_price)
      
        product = item.product
        json.id product.id
        json.title product.title
        json.description product.description
        json.price number_to_currency(product.price)
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


