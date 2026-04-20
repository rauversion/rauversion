require "rails_helper"

RSpec.describe EmailTemplate, type: :model do
  subject(:email_template) { build(:email_template) }

  it "is valid with the factory defaults" do
    expect(email_template).to be_valid
  end

  it "requires a user" do
    email_template.user = nil

    expect(email_template).not_to be_valid
    expect(email_template.errors[:user]).to be_present
  end

  it "requires a name" do
    email_template.name = ""

    expect(email_template).not_to be_valid
    expect(email_template.errors[:name]).to be_present
  end

  it "requires a subject" do
    email_template.subject = ""
    email_template.document = email_template.document.merge("subject" => "")

    expect(email_template).not_to be_valid
    expect(email_template.errors[:subject]).to be_present
  end

  it "normalizes the document payload" do
    email_template.document = {
      subject: "A custom subject",
      blocks: [{ type: "heading" }],
      theme: { accentColor: "#111111" },
    }

    email_template.validate

    expect(email_template.document["schemaVersion"]).to eq(1)
    expect(email_template.document["subject"]).to eq("A custom subject")
    expect(email_template.document["theme"]["accentColor"]).to eq("#111111")
    expect(email_template.document["theme"]["bodyBackground"]).to eq(EmailTemplate::DEFAULT_THEME["bodyBackground"])
  end
end
