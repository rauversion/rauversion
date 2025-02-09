json.collection @products do |product|
  json.extract! product, :id, :title, :description, :price, :category, :slug
    
  json.user do
    json.extract! product.user, :id, :username
  end if product.user.present?
  
  json.album do
    json.extract! product.album, :id, :title, :slug
  end if product.album.present?

  json.product_images product.product_images do |product_image|
    json.id product_image.id
    json.image_url rails_blob_url(product_image.image)
    json.gallery_url user_product_path(product.user.username, product, image: product_image.id)
  end
end


json.metadata do
  json.current_page @products.current_page
  json.total_pages @products.total_pages
  json.total_count @products.total_count
  json.next_page @products.next_page
  json.prev_page @products.prev_page
  json.is_first_page @products.first_page?
  json.is_last_page @products.last_page?
end