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

  it "preserves existing branding for blank form fields while allowing the tagline to be cleared" do
    branding = {
      template: "broadcast",
      heading_font: "ibm_plex",
      primary_color: "#112233",
      accent_color: "#445566",
      background_color: "#778899"
    }
    tenant.update!(**branding, tagline: "Original tagline")

    patch "/tenants/#{tenant.id}.json", params: {
      tenant: branding.transform_values { "" }.merge(name: "Updated tenant", tagline: "")
    }

    expect(response).to have_http_status(:success)
    expect(tenant.reload.name).to eq("Updated tenant")
    expect(tenant.tagline).to eq("")
    expect(JSON.parse(response.body).dig("tenant", "settings")).to include(branding.stringify_keys)
  end

  it "preserves branding when JSON fields are null or whitespace" do
    tenant.update!(heading_font: "ibm_plex", primary_color: "#112233")

    patch "/tenants/#{tenant.id}.json", params: {
      tenant: { heading_font: nil, primary_color: "   " }
    }, as: :json

    expect(response).to have_http_status(:success)
    expect(tenant.reload.heading_font).to eq("ibm_plex")
    expect(tenant.primary_color).to eq("#112233")
  end

  it "repairs stored blank branding during a partial settings update" do
    tenant.update_column(:settings, tenant.settings.merge("heading_font" => "", "accent_color" => ""))

    patch "/tenants/#{tenant.id}.json", params: { tenant: { name: "Updated tenant" } }

    expect(response).to have_http_status(:success)
    expect(tenant.reload.heading_font).to eq("space_grotesk")
    expect(tenant.accent_color).to eq("#22d3ee")
  end
end
