require 'rails_helper'

RSpec.describe PurchasesMailer, type: :mailer do
  describe '#event_ticket_confirmation' do
    let(:locale) { :es }
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

    around do |example|
      I18n.with_locale(locale) { example.run }
    end

    context 'email headers' do
      it 'renders the subject' do
        expect(mail.subject).to eq("Confirmación de compra: #{event.title}")
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
        expect(html_body).to include('Confirmación de ticket')
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

    context 'with an event timezone' do
      before do
        event.update!(
          timezone: "Asia/Tokyo",
          event_start: Time.utc(2024, 12, 12, 12, 30, 0),
          event_ends: Time.utc(2024, 12, 12, 14, 0, 0)
        )
      end

      let(:formatted_event_start) do
        I18n.l(event.event_start.in_time_zone(event.timezone), format: :event_long_with_zone)
      end

      it 'renders the event start time in the event timezone in HTML' do
        html_body = mail.html_part.body.decoded

        expect(html_body).to include(formatted_event_start)
        expect(html_body).not_to include(event.event_start.to_s)
      end

      it 'renders the event start time in the event timezone in text' do
        text_body = mail.text_part.body.decoded

        expect(text_body).to include(formatted_event_start)
        expect(text_body).not_to include(event.event_start.to_s)
      end
    end

    context 'with inviter' do
      let(:inviter) { FactoryBot.create(:user, first_name: 'John', last_name: 'Doe') }
      let(:mail) { PurchasesMailer.event_ticket_confirmation(purchase: purchase, inviter: inviter) }

      it 'uses invitation wording in the subject and both body formats' do
        expect(mail.subject).to eq("Te han invitado a #{event.title}")
        expect(mail.html_part.body.decoded).to include('Te han invitado', 'John Doe te ha invitado al evento.')
        expect(mail.text_part.body.decoded).to include('TE HAN INVITADO', 'John Doe te ha invitado al evento.')
      end

      it 'escapes the inviter name in HTML' do
        inviter.update!(first_name: '<script>alert(1)</script>')

        expect(mail.html_part.body.decoded).to include('&lt;script&gt;')
        expect(mail.html_part.body.decoded).not_to include('<script>')
      end
    end

    context 'with custom message' do
      let(:mail) do
        PurchasesMailer.event_ticket_confirmation(purchase: purchase, message: 'Looking forward to seeing you!')
      end

      it 'includes the custom message in HTML and text' do
        expect(mail.html_part.body.decoded).to include('Mensaje:', 'Looking forward to seeing you!')
        expect(mail.text_part.body.decoded).to include('MENSAJE', 'Looking forward to seeing you!')
      end
    end

    {
      es: {
        purchase_subject: 'Confirmación de compra:', purchase_heading: 'Confirmación de ticket',
        invitation_subject: 'Te han invitado a', invitation_heading: 'Te han invitado',
        access_heading: 'Cómo acceder a tus tickets', date: 'Fecha', location: 'Ubicación',
        qr_code: 'Tu código QR', qr_availability: 'Código QR disponible', message: 'Mensaje'
      },
      en: {
        purchase_subject: 'Purchase confirmation:', purchase_heading: 'Ticket confirmation',
        invitation_subject: "You've been invited to", invitation_heading: "You've been invited",
        access_heading: 'How to access your tickets', date: 'Date', location: 'Location',
        qr_code: 'Your QR code', qr_availability: 'The QR code is available', message: 'Message'
      }
    }.each do |email_locale, translations|
      context "with stored #{email_locale} locale" do
        before do
          purchase.update!(email_locale: email_locale.to_s)
        end

        it 'localizes the purchase subject, HTML, text and date when processed in another locale' do
          I18n.with_locale(email_locale == :es ? :en : :es) do
            mail = PurchasesMailer.event_ticket_confirmation(purchase: purchase)
            expect(mail.subject).to eq("#{translations[:purchase_subject]} #{event.title}")
            expect(mail.html_part.body.decoded).to include(translations[:purchase_heading], translations[:qr_code])
            expect(mail.text_part.body.decoded).to include(translations[:purchase_heading].upcase, translations[:qr_availability])
            [mail.html_part, mail.text_part].each do |part|
              expect(part.body.decoded).to include("#{translations[:date]}:", "#{translations[:location]}:")
              expect(part.body.decoded.downcase).to include(translations[:access_heading].downcase)
              expect(part.body.decoded).to include(I18n.l(event.event_start, locale: email_locale, format: :event_long_with_zone))
              expect(part.body.decoded).not_to include('Translation missing', 'translation_missing')
            end
            expect(I18n.locale).to eq(email_locale == :es ? :en : :es)
          end
        end

        it 'recognizes stored invitations after reloading and localizes both formats' do
          inviter = FactoryBot.create(:user, first_name: 'Ana', last_name: 'Pérez')
          purchase.update!(inviter_id: inviter.id)

          I18n.with_locale(email_locale == :es ? :en : :es) do
            mail = PurchasesMailer.event_ticket_confirmation(purchase: purchase.reload, message: 'See you there!')

            expect(mail.subject).to eq("#{translations[:invitation_subject]} #{event.title}")
            expect(mail.html_part.body.decoded).to include(ERB::Util.html_escape(translations[:invitation_heading]), 'Ana Pérez', "#{translations[:message]}:")
            expect(mail.text_part.body.decoded).to include(translations[:invitation_heading].upcase, 'Ana Pérez', translations[:message].upcase)
            expect(mail.html_part.body.decoded).not_to include(translations[:purchase_heading])
            expect(mail.text_part.body.decoded).not_to include(translations[:purchase_heading].upcase)
            expect(mail.attachments.first.filename).to eq("ticket_#{purchased_item.id}_qr_code.png")
          end
        end
      end
    end

    context 'when the inviter no longer exists' do
      before do
        purchase.update!(inviter_id: -1)
      end

      it 'still sends an invitation' do
        expect(mail.subject).to eq("Te han invitado a #{event.title}")
        expect(mail.html_part.body.decoded).to include('Te han invitado')
      end
    end

    context 'with a guest purchase' do
      before do
        purchase.assign_attributes(user: nil, guest_email: 'guest@example.com', email_locale: 'es')
      end

      it 'sends the localized confirmation to the guest' do
        expect(mail.to).to eq(['guest@example.com'])
        expect(mail.subject).to eq("Confirmación de compra: #{event.title}")
      end
    end

    context 'with ticket after purchase message' do
      let(:custom_ticket_message) { "Llega 30 minutos antes\nEntrada por acceso norte" }

      before do
        event_ticket.update!(after_purchase_message: custom_ticket_message)
      end

      it 'includes the ticket custom text in HTML' do
        html_body = mail.html_part.body.encoded

        expect(html_body).to include('Llega 30 minutos antes')
        expect(html_body).to include('Entrada por acceso norte')
      end

      it 'includes the ticket custom text in text format' do
        text_body = mail.text_part.body.encoded

        expect(text_body).to include('Llega 30 minutos antes')
        expect(text_body).to include('Entrada por acceso norte')
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
        expect(mail.subject).to eq("Confirmación de compra: #{event.title}")
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
        expect(mail.attachments.size).to eq(2)
        expect(mail.attachments.second.filename).to eq("ticket_#{purchased_item_with_qr.id}_qr_code.png")
      end
    end
  end
end
