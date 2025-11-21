json.collection @collection do |contact|
  json.id contact.id
  json.email contact.email
  json.name contact.name
  json.first_name contact.first_name
  json.last_name contact.last_name
  json.dni contact.dni
  json.country contact.country
  json.created_at contact.created_at
  json.updated_at contact.updated_at
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
