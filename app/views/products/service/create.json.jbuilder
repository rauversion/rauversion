if @product.errors.any?
  json.errors @product.errors.messages
else
  json.product do
    json.extract! @product, :id, :title, :description, :slug, :service_type, 
                           :duration, :prerequisites, :what_to_expect, 
                           :cancellation_policy
    json.photos @product.photos do |photo|
      json.id photo.id
      json.url url_for(photo)
    end
    json.user do
      json.extract! @product.user, :id, :username, :name
    end
    json.variants @product.variants do |variant|
      json.extract! variant, :id, :name, :price, :duration
    end
    json.available_dates @product.available_dates do |date|
      json.extract! date, :id, :start_time, :end_time, :status
    end if @product.respond_to?(:available_dates)
  end
end
