require "rails_helper"

RSpec.describe MessageMailer, type: :mailer do
  describe "new_message_notification" do
    let(:recipient) { FactoryBot.create(:user, username: "destinatario", email: "destinatario@example.com") }
    let(:sender) { FactoryBot.create(:user, username: "remitente", email: "remitente@example.com") }
    let(:conversation) { FactoryBot.create(:conversation, subject: "Conversacion de prueba") }
    let(:message) { FactoryBot.create(:message, user: sender, conversation: conversation, body: "Hola") }

    it "renders the spanish subject and body without missing translations" do
      I18n.with_locale(:es) do
        mail = described_class.with(message: message, recipient: recipient).new_message_notification

        expect(mail.to).to eq([recipient.email])
        expect(mail.subject).to eq("Nuevo mensaje de #{sender.username}")
        expect(mail.body.encoded).to include("¡Hola #{recipient.username}!")
        expect(mail.body.encoded).to include("#{sender.username} te ha enviado un nuevo mensaje en tu conversación")
        expect(mail.body.encoded).to include("Ver Conversación")
        expect(mail.body.encoded).not_to include("Translation missing")
        expect(mail.body.encoded).not_to include(">Greeting<")
        expect(mail.body.encoded).not_to include(">Body<")
        expect(mail.body.encoded).not_to include(">Footer<")
      end
    end
  end
end
