json.attendees @attendees do |attendee|
  json.id attendee.id
  json.name attendee.user.full_name
  json.email attendee.user.email
  json.initials attendee.user.initials
  json.avatar_url attendee.user.avatar_url(:small)
  json.ticket_name attendee.ticket.title
  json.ticket_price number_to_currency(attendee.ticket.price, unit: attendee.ticket.currency)
  json.status attendee.status
  json.created_at attendee.created_at
end

json.current_page @attendees.current_page
json.total_pages @attendees.total_pages
json.total_count @attendees.total_count
