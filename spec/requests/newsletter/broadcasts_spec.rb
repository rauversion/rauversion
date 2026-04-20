require "rails_helper"

RSpec.describe "Newsletter broadcasts", type: :request do
  describe "POST /newsletter/broadcasts/:id/send_now.json" do
    let(:user) do
      create(
        :user,
        confirmed_at: Time.current,
        can_send_newsletter: true,
        newsletter_broadcast_recipient_limit: 1
      )
    end

    let!(:contact_list) do
      Newsletter::ContactList.create!(user: user, name: "Lista principal")
    end

    let!(:first_contact) do
      Newsletter::Contact.create!(
        contact_list: contact_list,
        email: "one@example.com",
        first_name: "One"
      )
    end

    let!(:second_contact) do
      Newsletter::Contact.create!(
        contact_list: contact_list,
        email: "two@example.com",
        first_name: "Two"
      )
    end

    let!(:audience) do
      Newsletter::Audience.create!(user: user, name: "Todos")
    end

    let!(:source) do
      Newsletter::AudienceSource.create!(
        audience: audience,
        source_type: "contact_list",
        source_settings: { contact_list_id: contact_list.id.to_s },
        position: 0
      )
    end

    let!(:email_template) do
      user.email_templates.create!(
        name: "Campaña abril",
        subject: "Hola {{first_name}}",
        document: {
          "name" => "Campaña abril",
          "subject" => "Hola {{first_name}}",
          "preheader" => "",
          "blocks" => [],
        }
      )
    end

    let!(:broadcast) do
      Newsletter::Broadcast.create!(user: user, name: "Broadcast abril")
    end

    before do
      sign_in user
    end

    it "rejects sends that exceed the user's recipient limit" do
      post "/newsletter/broadcasts/#{broadcast.id}/send_now.json",
        params: {
          broadcast: {
            name: "Broadcast abril",
            audience_id: audience.id,
            email_template_id: email_template.id,
            subject_template: "Hola {{first_name}}",
            html_template: "<html><body>Hola {{first_name}}</body></html>",
          },
        },
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to include(
        "errors" => include("Esta audiencia supera tu limite de 1 destinatarios por newsletter")
      )

      expect(broadcast.reload.status).to eq("draft")
      expect(broadcast.recipients.count).to eq(0)
      expect(first_contact.email).to eq("one@example.com")
      expect(second_contact.email).to eq("two@example.com")
      expect(source.reload.source_type).to eq("contact_list")
    end
  end
end
