if @product.errors.any?
  json.errors @product.errors.messages
else
  json.product do
    json.extract! @product, :id, :title, :description, :slug, :brand, :model, :category
    json.photos @product.photos do |photo|
      json.id photo.id
      json.url url_for(photo)
    end
    json.user do
      json.extract! @product.user, :id, :username, :name
    end
  end
end
