class EventAttendeesMailer < ApplicationMailer
  def csv_export(user_email:, event_title:, csv_data:)
    @event_title = event_title
    
    attachments["attendees_#{Time.current.strftime('%Y%m%d_%H%M%S')}.csv"] = csv_data
    
    mail(
      to: user_email,
      subject: "Event Attendees Export - #{event_title}"
    )
  end
end
