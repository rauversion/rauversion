if params[:event_hosts_attributes].present?
  # Multiple hosts creation response
  json.success @failed_hosts.empty?
  
  if @failed_hosts.empty?
    json.message "All hosts created successfully"
    json.event_hosts @created_hosts do |host|
      json.id host.id
      # json.email host.email
      json.name host.name
      json.description host.description
      json.listed_on_page host.listed_on_page
      json.event_manager host.event_manager
      json.avatar_url host.avatar.url if host.avatar.present?
      json.created_at host.created_at
      json.updated_at host.updated_at
    end
  else
    json.message "Some hosts could not be created"
    json.created_hosts @created_hosts do |host|
      json.id host.id
      json.email host.email
      json.name host.name
    end
    json.failed_hosts @failed_hosts do |failed|
      json.params failed[:params]
      json.errors failed[:errors]
    end
  end
else
  # Single host creation response
  if @event_host.errors.any?
    json.success false
    json.errors do
      @event_host.errors.messages.each do |field, messages|
        json.set! field, messages
      end
    end
  else
    json.success true
    json.message "Host created successfully"
    json.event_host do
      json.id @event_host.id
      # json.email @event_host.email
      json.name @event_host.name
      json.description @event_host.description
      json.listed_on_page @event_host.listed_on_page
      json.event_manager @event_host.event_manager
      json.avatar_url @event_host.avatar.url if @event_host.avatar.present?
      json.created_at @event_host.created_at
      json.updated_at @event_host.updated_at
    end
  end
end
