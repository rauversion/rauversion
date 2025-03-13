if @product.errors.any?
  json.errors @product.errors.messages
else
  json.product do
    json.extract! @product, :id, :title, :description, :slug
    json.photos @product.product_images do |photo|
      json.id photo.id
      json.title photo.title
      json.description photo.description
      json.url photo.image_url(:large)
    end
    json.user do
      json.partial! 'users/user', user: @product.user, show_full_name: true
    end
  end
end
