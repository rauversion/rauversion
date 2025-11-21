json.id @event_list.id
json.name @event_list.name
json.created_at @event_list.created_at
json.updated_at @event_list.updated_at

json.event_list_contacts @event_list.event_list_contacts do |contact|
  json.id contact.id
  json.email contact.email
  json.name contact.name
  json.first_name contact.first_name
  json.last_name contact.last_name
  json.dni contact.dni
  json.country contact.country
  json.created_at contact.created_at
end
