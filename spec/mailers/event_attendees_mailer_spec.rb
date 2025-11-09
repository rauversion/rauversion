require 'rails_helper'

RSpec.describe EventAttendeesMailer, type: :mailer do
  describe '#csv_export' do
    let(:user_email) { 'user@example.com' }
    let(:event_title) { 'Test Event 2024' }
    let(:csv_data) { "ID,Name,Email\n1,John Doe,john@example.com" }
    
    let(:mail) do
      EventAttendeesMailer.csv_export(
        user_email: user_email,
        event_title: event_title,
        csv_data: csv_data
      )
    end

    around do |example|
      original_email_account = ENV['EMAIL_ACCOUNT']
      ENV['EMAIL_ACCOUNT'] = "test@example.com"
      begin
        example.run
      ensure
        ENV['EMAIL_ACCOUNT'] = original_email_account
      end
    end

    it 'renders the headers' do
      expect(mail.subject).to eq("Event Attendees Export - #{event_title}")
      expect(mail.to).to eq([user_email])
      expect(mail.from).to eq([ENV['EMAIL_ACCOUNT']])
    end

    it 'includes CSV attachment' do
      expect(mail.attachments.size).to eq(1)
      attachment = mail.attachments.first
      expect(attachment.filename).to match(/attendees_.*\.csv/)
      expect(attachment.content_type).to include('text/csv')
    end

    it 'includes event title in body' do
      expect(mail.body.encoded).to include(event_title)
    end
  end
end
