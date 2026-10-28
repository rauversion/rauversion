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

  before :each do
    allow_any_instance_of(EventAttendeesMailer).to receive(:default_email_account).and_return('test@example.com')
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
      
      expect(csv.headers).to include('ID', 'Name', 'Email', 'RUT', 'Ticket Title', 'Ticket Price', 'Status', 'Purchase Date', 'Checked In', 'Checked In At')
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
      expect(row['RUT']).to be_nil
    end

    it 'exports soft-deleted tickets with their title and price' do
      item = purchase.purchased_items.first
      item.update!(price: 35)
      ticket.destroy!
      expect(item.reload.purchased_item).to be_nil

      expect {
        EventAttendeesCsvExportJob.perform_now(event.id, user.id)
      }.to change { ActionMailer::Base.deliveries.count }.by(1)

      csv = CSV.parse(ActionMailer::Base.deliveries.last.attachments.first.body.decoded, headers: true)
      expect(csv.length).to eq(1)
      row = csv.first
      expect(row['ID']).to eq(item.id.to_s)
      expect(row['Email']).to eq(user.email)
      expect(row['Ticket Title']).to eq('General Admission')
      expect(row['Ticket Price'].to_d).to eq(50)
      expect(row['Paid Price'].to_d).to eq(35)
      expect(row['Status']).to eq('paid')
      expect(row['Checked In']).to eq('Yes')
    end

    it 'keeps attendees with missing tickets alongside attendees with existing tickets' do
      item = purchase.purchased_items.first
      item.update!(price: 35)
      ticket.really_destroy!
      expect(item.reload.purchased_item).to be_nil
      other_ticket = create(:event_ticket, event: event, title: 'VIP', price: 100)
      other_item = create(:purchased_item, purchase: purchase, purchased_item: other_ticket, state: 'paid')

      expect {
        EventAttendeesCsvExportJob.perform_now(event.id, user.id)
      }.to change { ActionMailer::Base.deliveries.count }.by(1)

      csv = CSV.parse(ActionMailer::Base.deliveries.last.attachments.first.body.decoded, headers: true)
      expect(csv.map { |row| row['ID'] }).to contain_exactly(item.id.to_s, other_item.id.to_s)
      row = csv.find { |record| record['ID'] == item.id.to_s }
      expect(row['Email']).to eq(user.email)
      expect(row['Ticket Title']).to be_nil
      expect(row['Ticket Price']).to be_nil
      expect(row['Paid Price'].to_d).to eq(35)
      expect(row['Status']).to eq('paid')
      expect(row['Checked In']).to eq('Yes')
      expect(csv.find { |record| record['ID'] == other_item.id.to_s }['Ticket Title']).to eq('VIP')
    end

    it 'exports the stored RUT for each ticket, even after the requirement is disabled' do
      purchase.update!(identifier_type: 'rut', identifier_value: '12.345.678-5')
      create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid')
      ticket.update!(required_identifier: '')

      EventAttendeesCsvExportJob.perform_now(event.id, user.id)

      csv = CSV.parse(ActionMailer::Base.deliveries.last.attachments.first.body.decoded, headers: true)
      expect(csv.map { |row| row['RUT'] }).to eq(['12345678-5', '12345678-5'])
    end

    describe 'filtered exports' do
      let(:checked_item) { purchase.purchased_items.find_by!(state: 'paid', checked_in: true) }
      let!(:unchecked_item) do
        create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid', checked_in: false)
      end
      let!(:legacy_unchecked_item) do
        create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'paid', checked_in: nil)
      end
      let!(:pending_item) do
        create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'pending')
      end
      let!(:refunded_item) do
        create(:purchased_item, purchase: purchase, purchased_item: ticket, state: 'refunded', checked_in: true)
      end
      let!(:other_item) do
        attendee = create(:user, email: 'other@example.com')
        other_purchase = create(:purchase, user: attendee, purchasable: event, state: 'paid')
        create(:purchased_item, purchase: other_purchase, purchased_item: ticket, state: 'paid', checked_in: true)
      end

      def exported_csv(filters)
        EventAttendeesCsvExportJob.perform_now(event.id, user.id, filters)
        CSV.parse(ActionMailer::Base.deliveries.last.attachments.first.body.decoded, headers: true)
      end

      it 'combines the search, payment status and admission criteria' do
        csv = exported_csv('query' => '  TEST@EXAMPLE.COM  ', 'status' => 'paid', 'checked_in' => 'true')

        expect(csv.map { |row| row['ID'] }).to eq([checked_item.id.to_s])
      end

      it 'includes both false and legacy null values when exporting unvalidated attendees' do
        csv = exported_csv('status' => 'paid', 'checked_in' => 'false')

        expect(csv.map { |row| row['ID'] }).to contain_exactly(unchecked_item.id.to_s, legacy_unchecked_item.id.to_s)
        expect(csv.map { |row| row['Checked In'] }).to all(eq('No'))
      end

      it 'exports all matching attendees across pages' do
        checked_item.update!(created_at: 2.days.ago)
        items = create_list(:purchased_item, 21, purchase: purchase, purchased_item: ticket,
          state: 'paid', checked_in: true, checked_in_at: Time.current)

        csv = exported_csv('query' => user.email, 'status' => 'paid', 'checked_in' => 'true')

        expect(csv.map { |row| row['ID'] }).to match_array((items.map(&:id) + [checked_item.id]).map(&:to_s))
        expect(csv[-1]['ID']).to eq(checked_item.id.to_s)
      end

      it 'keeps guest email matches and ticket details after the ticket is deleted' do
        purchase.update!(guest_email: 'guest.export@example.com')
        ticket.destroy!

        csv = exported_csv('query' => 'GUEST.EXPORT@', 'status' => 'paid', 'checked_in' => 'true')

        expect(csv.map { |row| row['ID'] }).to eq([checked_item.id.to_s])
        expect(csv.first['Email']).to eq(user.email)
        expect(csv.first['Ticket Title']).to eq(ticket.title)
      end

      it 'exports all attendees when the filters are cleared' do
        csv = exported_csv(query: '   ', status: 'all', checked_in: 'all')

        expect(csv.map { |row| row['ID'] }).to contain_exactly(
          checked_item.id.to_s, unchecked_item.id.to_s, legacy_unchecked_item.id.to_s,
          pending_item.id.to_s, refunded_item.id.to_s, other_item.id.to_s
        )
      end

      it 'produces a CSV with headers when no attendees match' do
        csv = exported_csv('query' => 'nobody-matches', 'status' => 'paid', 'checked_in' => 'true')

        expect(csv).to be_empty
        expect(csv.headers).to include('ID', 'Name', 'Email', 'Status', 'Checked In')
      end
    end
  end
end
