if @product.errors.any?
  json.errors @product.errors.messages
else
  json.product do
    json.extract! @product, :id, :title, :description, :slug, :artist, :genre, :release_date
    json.photos @product.photos do |photo|
      json.id photo.id
      json.url url_for(photo)
    end
    json.user do
      json.extract! @product.user, :id, :username, :name
    end
    json.variants @product.variants do |variant|
      json.extract! variant, :id, :name, :price, :sku, :stock_quantity
    end
  end
end
