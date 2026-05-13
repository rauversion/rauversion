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
    json.email @event_host.user&.email
    json.user_id @event_host.user_id
    json.record_type @event_host.user.present? ? "user" : "event_data"
    json.invitation_pending @event_host.user.present? && @event_host.user.invitation_sent_at.present? && @event_host.user.invitation_accepted_at.blank?
    json.name @event_host.name
    json.display_name @event_host.name.presence || @event_host.user&.display_name.presence || @event_host.user&.email
    json.description @event_host.description
    json.listed_on_page @event_host.listed_on_page
    json.event_manager @event_host.event_manager
    json.access_role @event_host.access_role
    if @event_host.avatar.attached?
      json.avatar_url do
        json.small @event_host.avatar_url(:small)
        json.medium @event_host.avatar_url(:medium)
        json.large @event_host.avatar_url(:large)
      end
    end
    json.created_at @event_host.created_at
    json.updated_at @event_host.updated_at
    if @event_host.user.present?
      json.user do
        json.partial! 'users/user', user: @event_host.user, show_full_name: true
        json.email @event_host.user.email
      end
    else
      json.user nil
    end
  end
  json.message "Host updated successfully"
end
