require "rails_helper"

RSpec.describe Tenant, type: :model do
  describe "storefront themes" do
    it "provides the theme matching the default Amplifier template" do
      tenant = build(:tenant)

      expect(tenant.theme_schema).to include(
        "type" => "registry:theme",
        "name" => "amplifier-electric"
      )
      expect(tenant.theme_schema.dig("cssVars", "light", "primary")).to eq("#5b32ff")
      expect(tenant).to be_valid
    end

    it "ships a valid registry theme for every storefront template" do
      Tenant::TEMPLATES.each do |template|
        tenant = build(:tenant, template: template, theme_schema: Tenant.theme_preset(template))
        expect(tenant.theme_schema.dig("cssVars", "light", "success")).to be_present
        expect(tenant.theme_schema.dig("cssVars", "dark", "success-foreground")).to be_present
        expect(tenant).to be_valid, "expected #{template} theme to be valid: #{tenant.errors.full_messages.join(', ')}"
      end
    end

    it "supports the broadcast storefront template" do
      tenant = build(:tenant, template: "broadcast")

      expect(tenant).to be_valid
    end

    it "rejects unsupported theme tokens" do
      tenant = build(:tenant)
      tenant.theme_schema = tenant.theme_schema.deep_dup
      tenant.theme_schema["cssVars"]["light"]["background-image"] = "url(https://example.com/pixel)"

      expect(tenant).not_to be_valid
      expect(tenant.errors[:theme_schema].join).to include("unsupported tokens")
    end

    it "rejects unsafe CSS values" do
      tenant = build(:tenant)
      tenant.theme_schema = tenant.theme_schema.deep_dup
      tenant.theme_schema["cssVars"]["light"]["background"] = "red; background: url(https://example.com/pixel)"

      expect(tenant).not_to be_valid
      expect(tenant.errors[:theme_schema].join).to include("invalid value for background")
    end
  end
end
