if @product.errors.any?
  json.errors @product.errors.messages
else
  json.product do
    json.extract! @product, :id, :title, :description, :slug, :brand, :model, :category
    json.photos @product.product_images do |photo|
      json.id photo.id
      json.image_url rails_blob_url(photo.image)
    end
    json.user do
      json.partial! 'users/user', user: @product.user, show_full_name: true
    end
  end
end
