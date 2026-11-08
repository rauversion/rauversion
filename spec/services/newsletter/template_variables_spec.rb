require "rails_helper"

RSpec.describe Newsletter::TemplateVariables do
  it "uses a supplied fallback before guessing a missing recipient name from the email" do
    recipient = Newsletter::BroadcastRecipient.new(email: "compras.123@example.com", name: "compras.123@example.com")
    values = described_class.build_map(sender: nil, recipient: recipient)

    expect(described_class.resolve("{{first_name}}", values)).to eq("Compras")
    expect(described_class.resolve("{{name|Hola}} · {{recipient_first_name|Sin nombre}}", values)).to eq("Hola · Sin nombre")
  end

  it "uses actual names and uniquely known ticket types, or the fallback if there are multiple" do
    recipient = Newsletter::BroadcastRecipient.new(email: "compras@example.com", first_name: "Lucía", event_titles: ["Festival"], ticket_titles: ["General", "VIP"])
    values = described_class.build_map(sender: nil, recipient: recipient)

    expect(described_class.resolve("{{first_name|Invitado}} · {{event_title|el evento}} · {{ticket_title|tu entrada}}", values)).to eq("Lucía · Festival · tu entrada")
  end

  it "escapes fallback text in email HTML without double escaping existing entities" do
    recipient = Newsletter::BroadcastRecipient.new(email: "compras@example.com")
    values = described_class.build_map(sender: nil, recipient: recipient)
    html = "<p>{{ticket_title|A &amp; B &lt;3}}</p>"

    expect(described_class.resolve(html, values, escape_html_values: true)).to eq("<p>A &amp; B &lt;3</p>")
  end
end
