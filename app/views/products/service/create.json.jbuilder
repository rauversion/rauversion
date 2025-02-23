if @product.errors.any?
  json.errors @product.errors.messages
else
  json.product do
    json.extract! @product, :id, :title, :description, :slug, :category, 
      :prerequisites, :what_to_expect, 
      :cancellation_policy,
      :delivery_method,
      :duration_minutes,
      :max_participants,
      :prerequisites,
      :what_to_expect,
      :cancellation_policy
    json.photos @product.product_images do |photo|
      json.id photo.id
      json.title photo.title
      json.description photo.description
      json.url photo.image_url(:large)
    end
    json.user do
      json.extract! @product.user, :id, :username, :full_name
    end
    #json.variants @product.variants do |variant|
    #  json.extract! variant, :id, :name, :price, :duration
    #end
    json.available_dates @product.available_dates do |date|
      json.extract! date, :id, :start_time, :end_time, :status
    end if @product.respond_to?(:available_dates)
  end
end
