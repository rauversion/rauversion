json.collection @collection do |purchase|
  json.id purchase.id
  json.created_at purchase.created_at
  json.updated_at purchase.updated_at
  json.state purchase.state
  json.price purchase.price
  
  json.purchased_items purchase.purchased_items do |item|
    json.id item.id
    json.state item.state
    json.checked_in item.checked_in
    json.checked_in_at item.checked_in_at
    
    json.purchased_item do
      json.id item.purchased_item.id
      json.type item.purchased_item_type
      json.title item.purchased_item.title
      
      case item.purchased_item
      when EventTicket
        json.description item.purchased_item.short_description
      else
        json.description item.purchased_item.description if item.purchased_item.respond_to?(:description)
      end

      if item.purchased_item.respond_to?(:cover_url)
        json.cover_url item.purchased_item.cover_url(:small)
      end
    end
  end
end

json.metadata do
  json.total_count @collection.total_count
  json.current_page @collection.current_page
  json.total_pages @collection.total_pages
  json.next_page @collection.next_page
  json.prev_page @collection.prev_page
  json.tab @tab
end
