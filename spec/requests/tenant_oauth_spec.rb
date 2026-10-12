require "rails_helper"

RSpec.describe "Tenant OAuth", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:tenant) { create(:tenant, slug: "label-site") }
  let(:user) { create(:user, confirmed_at: Time.current) }
  let(:return_path) { "/artist/products/synth?variant=blue#details" }

  around do |example|
    previous_test_mode = OmniAuth.config.test_mode
    previous_validation = OmniAuth.config.request_validation_phase
    previous_mock_auth = OmniAuth.config.mock_auth.dup
    OmniAuth.config.test_mode = true
    OmniAuth.config.request_validation_phase = nil
    example.run
  ensure
    OmniAuth.config.test_mode = previous_test_mode
    OmniAuth.config.request_validation_phase = previous_validation
    OmniAuth.config.mock_auth = previous_mock_auth
  end

  before do
    allow(TenantSubscriptions).to receive(:disabled?).and_return(true)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return("example.com")
    host! "#{tenant.slug}.example.com"
  end

  def start_oauth(provider = :google_oauth2, return_to: return_path, authenticity_token: nil, base_host: "example.com")
    post user_oauth_path(provider), params: {return_to: return_to, authenticity_token: authenticity_token}
    expect(response).to have_http_status(:see_other)
    expect(URI.parse(response.location).host).to eq(base_host)

    follow_redirect!
    expect(response).to have_http_status(:ok)
    expect(response.headers["Cache-Control"]).to include("no-store")
    form = Nokogiri::HTML(response.body).at_css("form#tenant-oauth-form")
    expect(form["method"]).to eq("post")
    params = form.css("input[name]").to_h { |input| [input["name"], input["value"]] }
    post form["action"], params: params, headers: {"Origin" => request.base_url}
  end

  def finish_oauth
    follow_redirect!
    expect(URI.parse(response.location).path).to end_with("/complete")
    follow_redirect!
  end

  %i[google_oauth2 discord].each do |provider|
    it "starts #{provider} on the base domain and returns authenticated to the tenant and page" do
      oauth2_mock(provider, email: user.email)

      start_oauth(provider)

      expect(response).to redirect_to("http://example.com/users/auth/#{provider}/callback")
      finish_oauth
      expect(response).to redirect_to("http://#{tenant.slug}.example.com#{return_path}")
      expect(response.headers["Set-Cookie"].to_s).to include("domain=example.com")

      host! "#{tenant.slug}.example.com"
      get "/api/v1/me.json"
      expect(JSON.parse(response.body).dig("current_user", "id")).to eq(user.id)
      expect(user.membership_for(tenant)).to be_nil
    end
  end

  it "sends Google the base domain callback URI and an OAuth state" do
    OmniAuth.config.test_mode = false

    start_oauth

    destination = URI.parse(response.location)
    query = Rack::Utils.parse_query(destination.query)
    expect(destination.host).to eq("accounts.google.com")
    expect(query["redirect_uri"]).to eq("http://example.com/users/auth/google_oauth2/callback")
    expect(query["state"]).to be_present
  end

  it "uses APP_DOMAIN as the base domain even when the request's parent domain differs" do
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return("https://auth.example.com:8443")

    post user_oauth_path(:google_oauth2)

    expect(response).to have_http_status(:see_other)
    expect(URI.parse(response.location).host).to eq("auth.example.com")
    expect(URI.parse(response.location).scheme).to eq("https")
    expect(URI.parse(response.location).port).to eq(8443)
  end

  it "authenticates through localhost and returns to a tenant with a separate session cookie" do
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return("localhost:3000")
    oauth2_mock(:google_oauth2, email: user.email)
    host! "#{tenant.slug}.example.com:3000"

    post user_oauth_path(:google_oauth2), params: {return_to: return_path}
    expect(URI.parse(response.location).host).to eq("localhost")
    expect(URI.parse(response.location).port).to eq(3000)
    follow_redirect!
    expect(response).to have_http_status(:ok)
    form = Nokogiri::HTML(response.body).at_css("form#tenant-oauth-form")
    post form["action"]
    expect(response).to redirect_to("http://localhost:3000/users/auth/google_oauth2/callback")

    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com:3000#{return_path}")
    get "/api/v1/me.json"
    expect(JSON.parse(response.body).dig("current_user", "id")).to eq(user.id)
  end

  it "sends Google the localhost callback configured in APP_DOMAIN" do
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return("localhost:3000")
    OmniAuth.config.test_mode = false

    start_oauth(base_host: "localhost")

    query = Rack::Utils.parse_query(URI.parse(response.location).query)
    expect(query["redirect_uri"]).to eq("http://localhost:3000/users/auth/google_oauth2/callback")
  end

  it "uses the configured application URL when APP_DOMAIN is absent instead of the tenant domain" do
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return(nil)

    post user_oauth_path(:google_oauth2)

    expect(URI.parse(response.location).host).to eq("localhost")
    expect(URI.parse(response.location).port).to eq(3000)
  end

  it "links the integration to the source account when the base domain has another user's session" do
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return("localhost:3000")
    base_user = create(:user, confirmed_at: Time.current)
    host! "localhost:3000"
    post user_session_path, params: {user: {email: base_user.email, password: "123456"}}
    host! "#{tenant.slug}.example.com:3000"
    post user_session_path, params: {user: {email: user.email, password: "123456"}}
    oauth2_mock(:google_oauth2, email: "integration@example.com")

    start_oauth(base_host: "localhost")
    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com:3000/#{user.username}/settings/integrations")
    expect(user.identities.find_by(provider: "google_oauth2")).to be_present
    expect(base_user.identities.find_by(provider: "google_oauth2")).to be_nil
  end

  it "rejects missing or tampered authentication results" do
    get complete_user_oauth_path(:google_oauth2)
    expect(response).to have_http_status(:bad_request)

    get complete_user_oauth_path(:google_oauth2, handoff_token: "tampered")
    expect(response).to have_http_status(:bad_request)
  end

  it "rejects replaying an authentication result" do
    oauth2_mock(:google_oauth2, email: user.email)
    start_oauth
    follow_redirect!
    location = response.location
    follow_redirect!
    expect(response).to be_redirect

    get location

    expect(response).to have_http_status(:bad_request)
  end

  it "rejects expired authentication results" do
    oauth2_mock(:google_oauth2, email: user.email)
    start_oauth
    follow_redirect!
    location = response.location

    travel 2.minutes do
      get location
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "rejects altered return data at the callback without signing in" do
    oauth2_mock(:google_oauth2, email: user.email)
    host! "example.com"

    post "/users/auth/google_oauth2?tenant_oauth_context=tampered"
    follow_redirect!

    expect(response).to have_http_status(:bad_request)
    get "/api/v1/me.json"
    expect(JSON.parse(response.body)["current_user"]).to be_nil
  end

  it "returns to a protected tenant page saved before login" do
    oauth2_mock(:google_oauth2, email: user.email)
    get "/purchases/products?page=2"
    expect(response).to redirect_to(new_user_session_path)

    start_oauth(return_to: nil)
    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com/purchases/products?page=2")
  end

  it "returns to the tenant home when there is no original page" do
    oauth2_mock(:google_oauth2, email: user.email)

    start_oauth(return_to: nil)
    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com/")
  end

  ["https://evil.example", "//evil.example", "/\\evil.example", "/users/sign_in"].each do |path|
    it "ignores the unsafe return path #{path.inspect}" do
      oauth2_mock(:google_oauth2, email: user.email)

      start_oauth(return_to: path)
      finish_oauth

      expect(response).to redirect_to("http://#{tenant.slug}.example.com/")
    end
  end

  it "keeps central sign-in on the base domain" do
    oauth2_mock(:google_oauth2, email: user.email)
    host! "example.com"

    start_oauth
    finish_oauth

    expect(response).to redirect_to("http://example.com#{return_path}")
  end

  it "preserves the protocol and development port" do
    allow(ENV).to receive(:[]).with("APP_DOMAIN").and_return("https://example.com:3000")
    oauth2_mock(:google_oauth2, email: user.email)
    https!
    host! "#{tenant.slug}.example.com:3000"

    start_oauth
    expect(response).to redirect_to("https://example.com:3000/users/auth/google_oauth2/callback")
    finish_oauth

    expect(response).to redirect_to("https://#{tenant.slug}.example.com:3000#{return_path}")
  end

  it "links an integration using the tenant's existing authenticated session" do
    post user_session_path, params: {user: {email: user.email, password: "123456"}}
    expect(response).to be_redirect
    oauth2_mock(:google_oauth2, email: "another-email@example.com")

    start_oauth
    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com/#{user.username}/settings/integrations")
    expect(user.identities.find_by(provider: "google_oauth2", uid: "12345")).to be_present
  end

  it "returns new users to tenant registration and preserves their original page after sign-up" do
    oauth2_mock(:google_oauth2, email: "new-oauth-user@example.com")
    allow(User).to receive(:allow_unconfirmed_access_for).and_return(2.days)

    start_oauth
    finish_oauth
    expect(response).to redirect_to("http://#{tenant.slug}.example.com/users/sign_up")
    follow_redirect!

    post user_registration_path, params: {user: {username: "new-oauth-user"}}

    expect(response).to redirect_to(return_path)
    registered_user = User.find_by!(email: "new-oauth-user@example.com")
    expect(registered_user.identities.find_by(provider: "google_oauth2")).to be_present
    expect(registered_user.membership_for(tenant)).to be_present
  end

  it "returns provider failures to the tenant's login with the original page" do
    OmniAuth.config.mock_auth[:google_oauth2] = :access_denied

    start_oauth
    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com/users/sign_in?return_to=#{CGI.escape(return_path)}")
  end

  it "rejects unknown providers" do
    post user_oauth_path("unknown")

    expect(response).to have_http_status(:not_found)
  end

  it "rejects a missing or tampered transfer context" do
    host! "example.com"
    get user_oauth_path(:google_oauth2)
    expect(response).to have_http_status(:bad_request)

    get user_oauth_path(:google_oauth2, tenant_oauth_context: "tampered")
    expect(response).to have_http_status(:bad_request)
  end

  it "rejects transfer contexts used on a tenant domain" do
    post user_oauth_path(:google_oauth2)
    get URI.parse(response.location).request_uri

    expect(response).to have_http_status(:bad_request)
  end

  it "rejects expired transfer contexts" do
    post user_oauth_path(:google_oauth2)
    location = response.location

    travel 16.minutes do
      get location
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "rejects contexts issued for another provider" do
    post user_oauth_path(:google_oauth2)
    location = response.location.sub("/google_oauth2?", "/discord?")
    get location

    expect(response).to have_http_status(:bad_request)
  end

  it "rejects authentication results belonging to another browser session" do
    oauth2_mock(:google_oauth2, email: user.email)
    start_oauth
    follow_redirect!
    location = response.location
    reset!
    get location

    expect(response).to have_http_status(:bad_request)
  end

  it "validates CSRF on both the tenant and the base domain" do
    previous_protection = ActionController::Base.allow_forgery_protection
    previous_oauth_protection = Users::OauthController.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    Users::OauthController.allow_forgery_protection = true
    OmniAuth.config.request_validation_phase = OmniAuth::RailsCsrfProtection::TokenVerifier.new
    oauth2_mock(:google_oauth2, email: user.email)

    post user_oauth_path(:google_oauth2)
    expect(response).to have_http_status(:unprocessable_entity)

    get new_user_session_path
    token = Nokogiri::HTML(response.body).at_css('meta[name="csrf-token"]')["content"]
    start_oauth(authenticity_token: token)
    finish_oauth

    expect(response).to redirect_to("http://#{tenant.slug}.example.com#{return_path}")
  ensure
    ActionController::Base.allow_forgery_protection = previous_protection
    Users::OauthController.allow_forgery_protection = previous_oauth_protection
  end
end
