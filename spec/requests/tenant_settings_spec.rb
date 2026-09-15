require "rails_helper"

RSpec.describe "Tenant settings", type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }
  let(:tenant) { create(:tenant) }

  before do
    tenant.memberships.create!(user: user, role: "owner")
    sign_in user
  end

  it "updates the template and a valid registry theme JSON" do
    theme = Tenant::DEFAULT_THEME_SCHEMA.deep_dup
    theme["name"] = "custom-broadcast"
    theme["cssVars"]["light"]["primary"] = "#c8ff00"

    patch "/tenants/#{tenant.id}.json", params: {
      tenant: {
        template: "broadcast",
        theme_schema: theme.to_json
      }
    }

    expect(response).to have_http_status(:success)
    expect(tenant.reload.template).to eq("broadcast")
    expect(tenant.theme_schema.dig("cssVars", "light", "primary")).to eq("#c8ff00")
  end

  it "rejects malformed theme JSON" do
    patch "/tenants/#{tenant.id}.json", params: {
      tenant: { theme_schema: "{not-json" }
    }

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).dig("errors", "theme_schema")).to include("must be valid JSON")
  end
end
