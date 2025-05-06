json.collection @products do |product|
  json.id product.id
  json.title product.title
  json.description sanitize(product.description, tags: %w(strong em))
  json.formatted_price number_to_currency(product.price)
  json.price product.price

  json.category product.category
  json.path user_product_path(product.user.username, product)

  image = product.product_images&.first
  json.cover_url do
    unless image.blank?
      json.small image.image_url(:small)
      json.medium image.image_url(:medium)
      json.large image.image_url(:large)
    end
  end
  json.user do
    json.partial! 'users/user', user: product.user, show_full_name: true
  end
  json.created_at product.created_at
  json.updated_at product.updated_at
  json.slug product.slug
  json.status product.status
  #json.variants product.variants do |variant|
  #  json.id variant.id
  #  json.title variant.title
  #  json.price variant.price
  #  json.stock variant.stock
  #end if product.variants.any?
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @products
end
