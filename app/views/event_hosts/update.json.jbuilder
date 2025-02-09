if @event_host.errors.any?
  json.success false
  json.errors do
    @event_host.errors.messages.each do |field, messages|
      json.set! field, messages
    end
  end
else
  json.success true
  json.event_host do
    json.id @event_host.id
    json.email @event_host.email
    json.name @event_host.name
    json.description @event_host.description
    json.listed_on_page @event_host.listed_on_page
    json.event_manager @event_host.event_manager
    json.avatar_url @event_host.avatar.url if @event_host.avatar.present?
    json.created_at @event_host.created_at
    json.updated_at @event_host.updated_at
  end
  json.message "Host updated successfully"
end
