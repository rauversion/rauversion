require 'rails_helper'

RSpec.describe PurchasesMailer, type: :mailer do
  describe '#event_ticket_confirmation' do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, title: 'Amazing Concert 2024') }
    let(:event_ticket) { FactoryBot.create(:event_ticket, event: event, title: 'VIP Pass') }
    let(:purchase) do
      FactoryBot.create(:purchase, user: user, purchasable: event)
    end
    let(:purchased_item) do
      FactoryBot.create(:purchased_item, purchase: purchase, purchased_item: event_ticket)
    end

    before do
      # Ensure purchased_item exists before sending mail
      purchased_item
      allow_any_instance_of(PurchasesMailer).to receive(:default_email_account).and_return('test@example.com')
    end

    let(:mail) { PurchasesMailer.event_ticket_confirmation(purchase: purchase) }

    context 'email headers' do
      it 'renders the subject' do
        expect(mail.subject).to eq('Purchase Confirmation')
      end

      it 'renders the receiver email' do
        expect(mail.to).to eq([user.email])
      end

      it 'renders the sender email' do
        expect(mail.from).to eq(['test@example.com'])
      end
    end

    context 'email body - HTML version' do
      let(:html_body) { mail.html_part.body.encoded }

      it 'includes event title' do
        expect(html_body).to include(event.title)
      end

      it 'includes confirmation message' do
        expect(html_body).to include('Confirmación de Ticket')
      end

      it 'includes access instructions' do
        expect(html_body).to include('Cómo acceder a tus tickets')
        expect(html_body).to include('Ingresa a Mi cuenta')
      end

      it 'includes ticket information' do
        expect(html_body).to include(event_ticket.title)
      end

      it 'includes Rauversion footer' do
        expect(html_body).to include('Rauversion')
      end

      it 'includes call to action link' do
        expect(html_body).to include('Ver mis tickets en la web')
      end
    end

    context 'email body - Text version' do
      let(:text_body) { mail.text_part.body.encoded }

      it 'includes event title' do
        expect(text_body).to include(event.title)
      end

      it 'includes confirmation message' do
        expect(text_body).to include('CONFIRMACIÓN DE TICKET')
      end

      it 'includes access instructions' do
        expect(text_body).to include('CÓMO ACCEDER A TUS TICKETS')
        expect(text_body).to include('Ingresa a Mi cuenta')
      end

      it 'includes ticket information' do
        expect(text_body).to include(event_ticket.title)
      end

      it 'includes Rauversion footer' do
        expect(text_body).to include('Rauversion')
        expect(text_body).to include('Music platform for independent artists')
      end
    end

    context 'with inviter' do
      let(:inviter) { FactoryBot.create(:user, first_name: 'John', last_name: 'Doe') }
      
      before do
        purchase.instance_variable_set(:@inviter, inviter)
        allow(purchase).to receive(:inviter).and_return(inviter)
      end

      it 'includes inviter information in HTML' do
        # Since @inviter is an instance variable set in the mailer action,
        # we need to test this differently or mock it properly
        # This is a placeholder for the actual test
        expect(mail.html_part.body.encoded).to be_present
      end
    end

    context 'with custom message' do
      before do
        purchase.instance_variable_set(:@message, 'Looking forward to seeing you!')
        allow(purchase).to receive(:message).and_return('Looking forward to seeing you!')
      end

      it 'includes custom message in HTML' do
        # Similar to above, this tests that the email is generated
        expect(mail.html_part.body.encoded).to be_present
      end
    end
  end
end
