json.array! @products do |product|
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
