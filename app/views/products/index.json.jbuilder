json.collection @products do |product|
  json.extract! product, :id, :slug, :title, :description, :price, :category, :slug
    
  json.user do
    json.partial! 'users/user', user: product.user, show_full_name: true
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
  json.partial! 'shared/pagination_metadata', collection: @products
end