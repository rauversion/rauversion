if @event_host.destroyed?
  json.success true
  json.message "Host removed successfully"
  json.event_host_id @event_host.id
else
  json.success false
  json.errors do
    @event_host.errors.messages.each do |field, messages|
      json.set! field, messages
    end
  end
end
