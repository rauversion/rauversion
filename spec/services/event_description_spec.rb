require "rails_helper"

RSpec.describe EventDescription do
  def document(*nodes)
    { type: "doc", content: nodes }
  end

  def paragraph(text, **attributes)
    { type: "paragraph", content: [{ type: "text", text: text }], **attributes }
  end

  it "keeps legacy text, literal tags and entities escaped" do
    description = "Música & amigos <strong>en vivo</strong>\nTrae <tu entrada>\n\nNos vemos &amp; bailamos"
    content = described_class.new(description)
    fragment = Loofah.fragment(content.html)

    expect(fragment.css("p").size).to eq(2)
    expect(fragment.css("br").size).to eq(1)
    expect(fragment.css("strong")).to be_empty
    expect(fragment.text(encode_special_chars: false)).to include("Música & amigos <strong>en vivo</strong>", "Trae <tu entrada>", "Nos vemos &amp; bailamos")
    expect(content.text).to eq(description)
  end

  it "converts legacy text into editable JSON without interpreting literal tags" do
    source = "Música & amigos <strong>en vivo</strong>\nOtra línea\n\nNos vemos"
    content = described_class.new(source)
    json = content.document

    expect(json["type"]).to eq("doc")
    expect(json["content"].size).to eq(2)
    expect(json.dig("content", 0, "content", 0, "text")).to eq("Música & amigos <strong>en vivo</strong>")
    expect(json.dig("content", 0, "content", 1, "type")).to eq("hardBreak")
    expect(described_class.new(nil, document: json).text).to eq(source)
  end

  it "renders Tiptap JSON formatting and alignment" do
    source = document(
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Fiesta" }] },
      { type: "paragraph", attrs: { textAlign: "center" }, content: [
        { type: "text", text: "Música", marks: [{ type: "bold" }] },
        { type: "text", text: " en vivo", marks: [{ type: "italic" }] }
      ] },
      { type: "bulletList", content: [{ type: "listItem", content: [paragraph("DJ")] }, { type: "listItem", content: [paragraph("Bandas")] }] }
    )
    fragment = Loofah.fragment(described_class.new(nil, document: source).html)

    expect(fragment.at_css("h2").text).to eq("Fiesta")
    expect(fragment.at_css("strong").text).to eq("Música")
    expect(fragment.at_css("em").text).to eq(" en vivo")
    expect(fragment.css("li").map(&:text)).to eq(["DJ", "Bandas"])
    expect(fragment.at_css("p")["style"]).to match(/text-align:\s*center/)
  end

  it "escapes HTML stored in JSON text nodes and removes unsafe link URLs" do
    source = document({ type: "paragraph", attrs: { onclick: "alert(1)" }, content: [
      { type: "text", text: "<script>alert(1)</script> & música" },
      { type: "text", text: "enlace", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }
    ] })
    html = described_class.new(nil, document: source).html
    fragment = Loofah.fragment(html)

    expect(html).to include("&lt;script&gt;", "&amp; música")
    expect(fragment.css("script, [onclick]")).to be_empty
    expect(fragment.at_css("a")["href"]).to be_nil
  end

  it "protects links that open a new tab" do
    source = document({ type: "paragraph", content: [
      { type: "text", text: "Entradas", marks: [{ type: "link", attrs: { href: "https://example.com", target: "_blank" } }] }
    ] })
    fragment = Loofah.fragment(described_class.new(nil, document: source).html)

    expect(fragment.at_css("a")["href"]).to eq("https://example.com")
    expect(fragment.at_css("a")["rel"]).to eq("noopener noreferrer")
  end

  it "produces readable summaries from JSON with correct characters and line breaks" do
    source = document(
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Fiesta" }] },
      { type: "paragraph", content: [{ type: "text", text: "Música & baile" }, { type: "hardBreak" }, { type: "text", text: "En vivo" }] },
      paragraph("Nos vemos")
    )
    expect(described_class.new(nil, document: source).text).to eq("Fiesta\n\nMúsica & baile\nEn vivo\n\nNos vemos")
  end

  it "renders the other formatting tools supported by the editor" do
    source = document(
      { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [paragraph("Primero")] }] },
      { type: "blockquote", content: [paragraph("Cita")] },
      { type: "codeBlock", content: [{ type: "text", text: "<código>" }] },
      { type: "paragraph", content: [{ type: "text", text: "Texto", marks: [{ type: "strike" }, { type: "underline" }] }] },
      { type: "horizontalRule" }
    )
    html = described_class.new(nil, document: source).html
    expect(html).to include('<ol start="3">', "<blockquote>", "<pre><code>&lt;código&gt;</code></pre>", "<u><s>Texto</s></u>", "<hr>")
  end

  [nil, "", "  \n "].each do |source|
    it "handles empty legacy content #{source.inspect}" do
      expect(described_class.new(source).html).to eq("")
      expect(described_class.new(source).document["type"]).to eq("doc")
    end
  end

  it "does not display an empty Tiptap document" do
    content = described_class.new("Old description", document: document({ type: "paragraph" }))
    expect(content.html).to eq("")
    expect(content.text).to eq("")
  end

  it "rejects malformed documents and unsupported node types" do
    ["not JSON", [], { type: "text", text: "hello" }, document({ type: "script" }), document({ type: "text", text: {} }), document({ type: "paragraph", content: "invalid" })].each do |source|
      expect(described_class.new(nil, document: source).valid_document?).to be(false)
    end
  end
end
