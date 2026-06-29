json.product do
  json.id @product.id
  json.type @product.type
  json.title @product.title
  json.slug @product.slug
  json.description @product.description
  json.service_kind @product.service_kind
  json.category @product.category
  json.booking_mode @product.booking_mode
  json.delivery_method @product.delivery_method
  json.duration_minutes @product.duration_minutes
  json.max_participants @product.max_participants
  json.prerequisites @product.prerequisites
  json.what_to_expect @product.what_to_expect
  json.cancellation_policy @product.cancellation_policy
  json.performance_format @product.performance_format
  json.home_city @product.home_city
  json.home_country @product.home_country
  json.available_countries @product.available_countries
  json.technical_rider @product.technical_rider
  json.hospitality_rider @product.hospitality_rider
  json.price_notes @product.price_notes
  json.price @product.price
  json.formatted_price number_to_currency(@product.price)
  json.post_purchase_instructions @product.post_purchase_instructions
  json.stock_quantity @product.stock_quantity
  json.status @product.status
  json.created_at @product.created_at
  json.updated_at @product.updated_at

  json.photos @product.product_images do |photo|
    json.id photo.id
    json.url url_for(photo.image)
    json.title photo.title
  end

  json.service_price_rules @product.service_price_rules.ordered do |rule|
    json.id rule.id
    json.name rule.name
    json.rule_type rule.rule_type
    json.amount rule.amount
    json.currency rule.currency
    json.duration_minutes rule.duration_minutes
    json.location_scope rule.location_scope
    json.min_notice_days rule.min_notice_days
    json.conditions rule.conditions
    json.active rule.active
    json.position rule.position
  end

  json.user do
    json.partial! 'users/user', user: @product.user, show_full_name: true
  end
end
