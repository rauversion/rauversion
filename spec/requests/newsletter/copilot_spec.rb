require "rails_helper"

RSpec.describe "Newsletter copilot", type: :request do
  let(:user) { create(:user, confirmed_at: Time.current, can_send_newsletter: true) }
  let(:client) { instance_double(OpenAI::Client) }
  let(:draft_prompt) { "Recordatorio de entradas pendientes para el festival. Tono cercano." }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("OPENAI_API_KEY").and_return("test-key")
    allow(OpenAI::Client).to receive(:new).with(hash_including(access_token: "test-key")).and_return(client)
  end

  it "generates a structured draft without saving or sending it" do
    sign_in user
    draft = {
      "subject" => "Tu entrada está pendiente", "preheader" => "Revisa tu compra",
      "blocks" => [{ "type" => "heading", "title" => "Nos vemos en el festival" }, { "type" => "text", "text" => "Hola.\n\n<img src=x>" }],
    }
    expect(client).to receive(:json_post) do |path:, parameters:|
      expect(path).to eq("/responses")
      expect(parameters[:store]).to be(false)
      expect(JSON.parse(parameters[:input])).to include("brief" => draft_prompt)
      expect(parameters.dig(:text, :format)).to include(type: "json_schema", strict: true)
      expect(parameters.dig(:text, :format, :schema, :required)).to match_array(draft.keys.map(&:to_sym))
      completed_response(draft)
    end

    expect { generate(mode: "draft", prompt: draft_prompt) }.not_to change(EmailTemplate, :count)

    expect(response).to have_http_status(:ok)
    suggestion = response.parsed_body.fetch("suggestion")
    expect(suggestion).to include("mode" => "draft", "subject" => draft.fetch("subject"))
    expect(suggestion.fetch("blocks").pluck("type")).to eq(%w[heading text])
    expect(suggestion.dig("blocks", 1, "props", "content")).to eq("<p>Hola.</p><p>&lt;img src=x&gt;</p>")
  end

  it "grounds a reminder in the chosen event, excludes hidden details and attaches the real event URL" do
    sign_in user
    event = create(:event, user: user, state: "published", visibility: "public", title: "Festival de prueba",
      event_start: Time.utc(2026, 12, 1, 21), timezone: "America/Santiago", venue: "Ubicación reservada", hide_location_until_purchase: true)
    create(:purchase, purchasable: event, user: create(:user, email: "buyer@example.com"))

    expect(client).to receive(:json_post) do |path:, parameters:|
      input = JSON.parse(parameters[:input])
      expect(input.fetch("event")).to include("title" => event.title, "starts_at" => "2026-12-01T18:00:00-03:00", "timezone" => "America/Santiago")
      expect(input.to_json).not_to include("Ubicación reservada", "buyer@example.com")
      completed_response("subject" => "Tu compra sigue pendiente", "preheader" => "Festival de prueba",
        "blocks" => [{ "type" => "text", "text" => "Te escribimos por {{ticket_title|tu entrada}}." }])
    end

    generate(mode: "reminder", event_id: event.id)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("suggestion", "blocks").last).to include("type" => "button",
      "props" => include("href" => a_string_ending_with(event_path(event))))
  end

  it "does not list or send events outside the user's current site or ownership" do
    sign_in user
    accessible = create(:event, user: user)
    hidden = [create(:event, user: user, tenant: create(:tenant)), create(:event)]
    expect(client).not_to receive(:json_post)

    get "/newsletter/copilot/events.json", as: :json
    expect(response.parsed_body.fetch("events").pluck("id")).to eq([accessible.id.to_s])

    hidden.each do |event|
      generate(mode: "reminder", event_id: event.id)
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  it "resolves the supplied URL when composing one button" do
    sign_in user
    allow(client).to receive(:json_post).and_return(completed_response("blocks" => [{ "type" => "button", "title" => "Escuchar", "link" => "url_1" }]))

    generate(mode: "block", block_type: "button", prompt: "Agrega un botón para https://example.com/album")

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("suggestion", "blocks")).to eq([{ "type" => "button", "props" => { "text" => "Escuchar", "href" => "https://example.com/album" } }])
  end

  it "rejects an asset reference the user did not provide" do
    sign_in user
    allow(client).to receive(:json_post).and_return(completed_response("blocks" => [{ "type" => "button", "title" => "Escuchar", "link" => "https://invented.example" }]))

    generate(mode: "block", block_type: "button", prompt: "Agrega un botón para https://example.com/album")

    expect(response).to have_http_status(:bad_gateway)
  end

  it "rewrites the original text while keeping its template variables" do
    sign_in user
    original = "Te recordamos que {{ticket_title|tu entrada}} sigue pendiente."
    body = "Sigue pendiente {{ticket_title|tu entrada}}."
    expect(client).to receive(:json_post) do |path:, parameters:|
      expect(JSON.parse(parameters[:input])).to eq("brief" => "Acórtalo", "original_text" => original)
      completed_response("body" => body)
    end

    generate(mode: "rewrite", prompt: "Acórtalo", original_text: original)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["suggestion"]).to eq("mode" => "rewrite", "body" => body)
  end

  it "does not offer a rewrite that drops a template variable" do
    sign_in user
    allow(client).to receive(:json_post).and_return(completed_response("body" => "Tu entrada sigue pendiente."))

    generate(mode: "rewrite", original_text: "Hola {{first_name}}, tu entrada sigue pendiente.")

    expect(response).to have_http_status(:bad_gateway)
    expect(response.parsed_body.fetch("errors").first).to include("variables")
  end

  it "uses the working draft and recent turns to edit one field and add a block at an existing anchor" do
    sign_in user
    context = editor_context
    history = [{ role: "user", text: "Usa un tono cercano" }, { role: "assistant", text: "Acorté el saludo." }]
    expect(client).to receive(:json_post) do |path:, parameters:|
      input = JSON.parse(parameters[:input])
      expect(input.dig("editor", "selected_block_id")).to eq("intro")
      expect(input.dig("editor", "blocks", 0, "fields", 0, "text")).to eq("Hola {{first_name|equipo}}:")
      expect(input.fetch("conversation")).to eq(history.map(&:stringify_keys))
      expect(input.to_json).not_to include("private-reference=abc")
      completed_response("message" => "Acorté la introducción y añadí un botón.", "subject" => nil, "preheader" => nil,
        "changes" => [
          { "action" => "update", "block_id" => "intro", "field" => "content:0", "value" => "Gracias, {{first_name|equipo}}." },
          { "action" => "insert", "after" => "intro", "block" => { "type" => "button", "title" => "Abrir evento", "link" => "existing_1" } },
        ])
    end

    generate(mode: "edit", prompt: "Hazlo más corto y pon un botón abajo con el mismo enlace.", editor_context: context, history: history)

    expect(response).to have_http_status(:ok)
    suggestion = response.parsed_body.fetch("suggestion")
    expect(suggestion).to include("mode" => "edit", "subject" => nil, "preheader" => nil)
    expect(suggestion.fetch("changes")).to eq([
      { "action" => "update", "block_id" => "intro", "field" => "content:0", "value" => "Gracias, {{first_name|equipo}}." },
      { "action" => "insert", "after" => "intro", "block" => { "type" => "button", "props" => { "text" => "Abrir evento", "href" => "https://example.com/event?private-reference=abc" } } },
    ])
  end

  it "can answer a question without proposing changes" do
    sign_in user
    result = { "message" => "El primer bloque saluda a tu audiencia.", "subject" => nil, "preheader" => nil, "changes" => [] }
    allow(client).to receive(:json_post).and_return(completed_response(result))

    generate(mode: "edit", prompt: "¿Qué dice al principio?", editor_context: editor_context)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("suggestion")).to eq(result.merge("mode" => "edit"))
  end

  it "rejects edits to a noneditable field even if it appears in the context" do
    sign_in user
    context = editor_context
    context[:blocks].last[:fields] << { key: "href", text: "https://example.com/event" }
    allow(client).to receive(:json_post).and_return(completed_response("message" => "Cambié el enlace.", "subject" => nil, "preheader" => nil,
      "changes" => [{ "action" => "update", "block_id" => "cta", "field" => "href", "value" => "javascript:alert(1)" }]))

    generate(mode: "edit", prompt: "Actualiza el CTA", editor_context: context)

    expect(response).to have_http_status(:bad_gateway)
  end

  it "does not accept a contextual edit that drops an existing fallback" do
    sign_in user
    allow(client).to receive(:json_post).and_return(completed_response("message" => "Cambié el saludo.", "subject" => nil, "preheader" => nil,
      "changes" => [{ "action" => "update", "block_id" => "intro", "field" => "content:0", "value" => "Hola:" }]))

    generate(mode: "edit", prompt: "Ajusta el saludo", editor_context: editor_context)

    expect(response).to have_http_status(:bad_gateway)
    expect(response.parsed_body.fetch("errors").first).to include("variables")
  end

  it "does not call OpenAI for users without newsletter access" do
    sign_in create(:user, confirmed_at: Time.current, can_send_newsletter: false)
    expect(client).not_to receive(:json_post)

    generate(mode: "draft", prompt: draft_prompt)

    expect(response).to have_http_status(:forbidden)
  end

  it "does not call OpenAI with an oversized prompt" do
    sign_in user
    expect(client).not_to receive(:json_post)

    generate(mode: "draft", prompt: "x" * 3_001)

    expect(response).to have_http_status(:unprocessable_content)
  end

  it "returns a useful error when the OpenAI key is missing" do
    sign_in user
    allow(ENV).to receive(:[]).with("OPENAI_API_KEY").and_return(nil)
    expect(client).not_to receive(:json_post)

    generate(mode: "draft", prompt: draft_prompt)

    expect(response).to have_http_status(:service_unavailable)
    expect(response.parsed_body.fetch("errors").first).to include("no está configurado")
  end

  it "does not expose provider errors" do
    sign_in user
    allow(client).to receive(:json_post).and_raise(Faraday::TimeoutError, "Provider details")

    generate(mode: "draft", prompt: draft_prompt)

    expect(response).to have_http_status(:bad_gateway)
    expect(response.body).not_to include("Provider details")
  end

  def generate(**input)
    post "/newsletter/copilot.json", params: { newsletter_copilot: input }, as: :json
  end

  def editor_context
    {
      name: "Newsletter", subject: "Nos vemos pronto", preheader: "Festival", selected_block_id: "intro",
      blocks: [
        { id: "intro", type: "text", fields: [{ key: "content:0", text: "Hola {{first_name|equipo}}:" }], assets: [] },
        { id: "cta", type: "button", fields: [{ key: "text", text: "Ver evento" }],
          assets: [{ kind: "link", url: "https://example.com/event?private-reference=abc", label: "Ver evento" }] },
      ],
    }
  end

  def completed_response(result)
    {
      "status" => "completed",
      "output" => [{ "type" => "message", "content" => [{ "type" => "output_text", "text" => result.to_json }] }],
    }
  end
end
