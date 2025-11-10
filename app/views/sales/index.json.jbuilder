json.collection @collection do |sale|
  json.id sale.id
  json.created_at sale.created_at
  json.updated_at sale.updated_at
  json.purchase_type sale.class.to_s
  if sale.is_a?(ProductPurchase)
    json.type 'Product'
    json.items sale.product_purchase_items do |item|
      json.id item.id
      json.quantity item.quantity
      json.price item.price
      json.product do
        json.id item.product.id
        json.title item.product.title
        json.description item.product.description
        json.product_type item.product.class.to_s
      end

      if item.product.is_a?(Products::ServiceProduct)
        service_booking = item.product.service_bookings.where(customer_id: sale.user.id).first
        json.service_booking do
          json.id service_booking.id
          json.scheduled_date service_booking.scheduled_date
          json.scheduled_time service_booking.scheduled_date
          json.timezone service_booking.scheduled_date
          json.status service_booking.status
          json.user do
            json.id service_booking.customer.id
            json.email service_booking.customer.email
            json.name service_booking.customer.full_name
          end
        end 
      end
    end
    json.total_quantity sale.total_quantity
    json.status sale.status
    json.shipping_status sale.shipping_status
    json.tracking_code sale.tracking_code

    json.buyer do
      json.id sale.user.id
      json.email sale.user.email
      json.name sale.user.full_name
    end
  else
    json.type @tab
    json.purchased_item do
      json.id sale.purchased_item.id
      json.title sale.purchased_item.title
      json.description sale.purchased_item.description
      json.cover_url sale.purchased_item.cover_url(:small)
    end
    
    json.price sale.price
    json.currency sale.currency

    json.purchase do
      json.id sale.purchase.id
      json.created_at sale.purchase.created_at
      json.state sale.purchase.state
      json.price sale.purchase.price
      json.user do
        json.id sale.purchase.user.id
        json.email sale.purchase.user.email
        json.name sale.purchase.user.full_name
      end
    end
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
  json.tab @tab
end
