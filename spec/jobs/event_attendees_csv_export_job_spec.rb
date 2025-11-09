require 'rails_helper'

RSpec.describe EventAttendeesCsvExportJob, type: :job do
  let(:user) { create(:user, email: 'test@example.com') }
  let(:event) { create(:event, user: user, title: 'Test Event') }
  let(:ticket) { create(:event_ticket, event: event, title: 'General Admission', price: 50) }
  
  let!(:purchase) do
    purchase = create(:purchase, user: user, purchasable: event, state: 'paid')
    create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid', checked_in: true, checked_in_at: Time.current)
    purchase
  end

  before do
    ENV['EMAIL_ACCOUNT'] = 'test@example.com'
  end

  describe '#perform' do
    it 'sends an email with CSV attachment' do
      expect {
        EventAttendeesCsvExportJob.perform_now(event.id, user.id)
      }.to change { ActionMailer::Base.deliveries.count }.by(1)
      
      mail = ActionMailer::Base.deliveries.last
      expect(mail.to).to include(user.email)
      expect(mail.subject).to include('Test Event')
      expect(mail.attachments.size).to eq(1)
      expect(mail.attachments.first.filename).to match(/attendees_.*\.csv/)
    end

    it 'generates CSV with correct headers' do
      EventAttendeesCsvExportJob.perform_now(event.id, user.id)
      
      mail = ActionMailer::Base.deliveries.last
      csv_content = mail.attachments.first.body.decoded
      csv = CSV.parse(csv_content, headers: true)
      
      expect(csv.headers).to include('ID', 'Name', 'Email', 'Ticket Title', 'Ticket Price', 'Status', 'Purchase Date', 'Checked In', 'Checked In At')
    end

    it 'includes purchase data in CSV' do
      EventAttendeesCsvExportJob.perform_now(event.id, user.id)
      
      mail = ActionMailer::Base.deliveries.last
      csv_content = mail.attachments.first.body.decoded
      csv = CSV.parse(csv_content, headers: true)
      
      expect(csv.length).to eq(1)
      row = csv.first
      expect(row['Email']).to eq(user.email)
      expect(row['Ticket Title']).to eq('General Admission')
      expect(row['Status']).to eq('paid')
      expect(row['Checked In']).to eq('Yes')
    end
  end
end
