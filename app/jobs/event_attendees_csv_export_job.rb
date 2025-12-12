require 'csv'

class EventAttendeesCsvExportJob < ApplicationJob
  queue_as :default

  def perform(event_id, user_id)
    event = Event.find(event_id)
    user = User.find(user_id)
    
    # Generate CSV data
    csv_data = generate_csv(event)
    
    # Send email with CSV attachment
    EventAttendeesMailer.csv_export(
      user_email: user.email,
      event_title: event.title,
      csv_data: csv_data
    ).deliver_now
  end

  private

  def generate_csv(event)
    CSV.generate(headers: true) do |csv|
      # Header row
      csv << [
        'ID',
        'Name',
        'Email',
        'Ticket Title',
        'Ticket Price',
        'Paid Price',
        'Status',
        'Purchase Date',
        'Checked In',
        'Checked In At'
      ]
      
      # Data rows
      event.purchased_items
           .includes(purchase: :user, purchased_item: :event_ticket)
           .order(created_at: :desc)
           .each do |item|
        purchase = item.purchase
        user = purchase.user
        ticket = item.purchased_item
        
        csv << [
          item.id,
          "#{user.first_name} #{user.last_name}".strip.presence || user.username,
          user.email,
          ticket.title,
          ticket.price,
          item.price,
          item.state,
          item.created_at.strftime('%Y-%m-%d %H:%M:%S'),
          item.checked_in? ? 'Yes' : 'No',
          item.checked_in_at&.strftime('%Y-%m-%d %H:%M:%S')
        ]
      end
    end
  end
end
