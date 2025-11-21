json.collection @collection do |event_list|
  json.id event_list.id
  json.name event_list.name
  json.created_at event_list.created_at
  json.updated_at event_list.updated_at
  json.contacts_count event_list.event_list_contacts.count
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
