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
      json.extract! @product.user, :id, :username, :full_name
    end
  end
end
