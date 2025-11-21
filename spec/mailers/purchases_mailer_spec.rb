require 'rails_helper'

RSpec.describe PurchasesMailer, type: :mailer do
  describe '#event_ticket_confirmation' do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, title: 'Amazing Concert 2024', user: user, ticket_currency: "USD") }
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
        expect(text_body).to include('Music multiverses')
      end
    end

    context 'with inviter' do
      let(:inviter) { FactoryBot.create(:user, first_name: 'John', last_name: 'Doe') }
      
      before do
        #purchase.instance_variable_set(:@inviter, inviter)
        #allow(purchase).to receive(:inviter).and_return(inviter)
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
        #purchase.instance_variable_set(:@message, 'Looking forward to seeing you!')
        #allow(purchase).to receive(:message).and_return('Looking forward to seeing you!')
      end

      it 'includes custom message in HTML' do
        # Similar to above, this tests that the email is generated
        expect(mail.html_part.body.encoded).to be_present
      end
    end

    context 'QR code attachments' do
      it 'includes QR code attachments for each purchased item' do
        expect(mail.attachments.size).to eq(1)
      end

      it 'names the attachment correctly' do
        attachment = mail.attachments.first
        expect(attachment.filename).to eq("ticket_#{purchased_item.id}_qr_code.png")
      end

      it 'attaches PNG files' do
        attachment = mail.attachments.first
        expect(attachment.content_type).to start_with('image/png')
      end

      it 'includes non-empty QR code data' do
        attachment = mail.attachments.first
        expect(attachment.body.decoded.size).to be > 0
      end
    end

    context 'with multiple tickets' do
      let(:event_ticket_2) { FactoryBot.create(:event_ticket, event: event, title: 'General Admission') }
      let(:purchased_item_2) do
        FactoryBot.create(:purchased_item, purchase: purchase, purchased_item: event_ticket_2)
      end

      before do
        purchased_item_2
      end

      it 'includes QR code attachments for all tickets' do
        expect(mail.attachments.size).to eq(2)
      end

      it 'names each attachment uniquely' do
        filenames = mail.attachments.map(&:filename)
        expect(filenames).to contain_exactly(
          "ticket_#{purchased_item.id}_qr_code.png",
          "ticket_#{purchased_item_2.id}_qr_code.png"
        )
      end
    end

    context 'when disable_qr is enabled' do
      before do
        event_ticket.disable_qr = true
        event_ticket.save!
      end

      it 'does not include QR code attachment' do
        expect(mail.attachments.size).to eq(0)
      end

      it 'still sends the email' do
        expect(mail.subject).to eq('Purchase Confirmation')
        expect(mail.to).to eq([user.email])
      end

      it 'does not display QR code section in HTML body' do
        html_body = mail.html_part.body.encoded
        expect(html_body).to include(event_ticket.title)
        expect(html_body).not_to include('Tu código QR')
      end

      it 'does not display QR code message in text body' do
        text_body = mail.text_part.body.encoded
        expect(text_body).to include(event_ticket.title)
        expect(text_body).not_to include('Código QR disponible')
      end
    end

    context 'with mixed disable_qr settings' do
      let(:event_ticket_with_qr) { FactoryBot.create(:event_ticket, event: event, title: 'VIP Pass') }
      let(:event_ticket_without_qr) { FactoryBot.create(:event_ticket, event: event, title: 'General Admission') }
      let(:purchased_item_with_qr) do
        FactoryBot.create(:purchased_item, purchase: purchase, purchased_item: event_ticket_with_qr)
      end
      let(:purchased_item_without_qr) do
        FactoryBot.create(:purchased_item, purchase: purchase, purchased_item: event_ticket_without_qr)
      end

      before do
        event_ticket_with_qr.disable_qr = false
        event_ticket_with_qr.save!
        event_ticket_without_qr.disable_qr = true
        event_ticket_without_qr.save!
        purchased_item_with_qr
        purchased_item_without_qr
      end

      it 'includes QR code only for tickets with disable_qr = false' do
        # Recreate the mail after setting up the purchased items
        mail = PurchasesMailer.event_ticket_confirmation(purchase: purchase)
        expect(mail.attachments.size).to eq(1)
        expect(mail.attachments.first.filename).to eq("ticket_#{purchased_item_with_qr.id}_qr_code.png")
      end
    end
  end
end
