json.collection @products do |product|
  json.id product.id
  json.title product.title
  json.description product.description
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
    json.id product.user.id
    json.username product.user.username
    json.avatar_url do
      json.small product.user.avatar_url(:small)
    end
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
  json.current_page @products.current_page
  json.total_pages @products.total_pages
  json.total_count @products.total_count
  json.next_page @products.next_page
  json.prev_page @products.prev_page
  json.is_first_page @products.first_page?
  json.is_last_page @products.last_page?
end
