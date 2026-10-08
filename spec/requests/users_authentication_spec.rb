require "rails_helper"

RSpec.describe "User authentication", type: :request do
  let(:password) { "valid-password-123" }
  let(:user) do
    create(:user, confirmed_at: Time.current, password: password,
      password_confirmation: password, username: "account-user", display_name: "Account name")
  end

  def log_in(password: self.password)
    post user_session_path(format: :json), params: {
      user: { email: user.email, password: password }
    }, as: :json
  end

  def response_user
    JSON.parse(response.body).fetch("user")
  end

  it "signs in with the current tenant profile even when the public profile loader has not run" do
    user.tenant_profile_for.update!(display_name: "Tenant artist", first_name: "Artist",
      last_name: "Name", country: "Chile", city: "Santiago", bio: "Tenant bio")

    log_in

    expect(response).to have_http_status(:ok)
    expect(response_user).to include(
      "id" => user.id, "username" => "account-user", "display_name" => "Tenant artist",
      "first_name" => "Artist", "last_name" => "Name", "country" => "Chile",
      "city" => "Santiago", "bio" => "Tenant bio"
    )
    expect(response.headers["X-CSRF-Token"]).to be_present
    expect(user.reload.display_name).to eq("Account name")

    get "/api/v1/me.json"
    expect(JSON.parse(response.body).dig("current_user", "id")).to eq(user.id)
  end

  it "selects the profile belonging to the sign-in host" do
    tenant = create(:tenant, slug: "label-site")
    user.memberships.create!(tenant: tenant, role: "member")
    user.tenant_profile_for(tenant).update!(display_name: "Label artist", bio: "Label bio")
    user.tenant_profile_for(Current.tenant).update!(display_name: "Central artist", bio: "Central bio")
    host! "label-site.example.com"

    log_in

    expect(response).to have_http_status(:ok)
    expect(response_user).to include("display_name" => "Label artist", "bio" => "Label bio")
  end

  it "repairs a missing profile for an existing membership when signing in" do
    user.tenant_profiles.delete_all
    membership_count = user.memberships.count

    log_in

    expect(response).to have_http_status(:ok)
    expect(response_user).to include("id" => user.id, "username" => "account-user", "display_name" => "Account name")
    expect(user.tenant_profile_for(Current.tenant).display_name).to eq("Account name")
    expect(user.tenant_profiles.count).to eq(1)
    expect(user.memberships.count).to eq(membership_count)
  end

  it "does not use another tenant's profile or grant membership when signing in as a visitor" do
    user.tenant_profile_for.update!(display_name: "Central-only name", bio: "Central-only bio")
    tenant = create(:tenant, slug: "another-site")
    host! "another-site.example.com"

    log_in

    expect(response).to have_http_status(:ok)
    expect(response_user).to include("username" => "account-user", "display_name" => "Account name")
    expect(response_user["bio"]).not_to eq("Central-only bio")
    expect(user.membership_for(tenant)).to be_nil
    expect(user.tenant_profile_for(tenant)).to be_nil
  end

  it "continues to reject invalid credentials" do
    user.tenant_profiles.delete_all
    log_in(password: "incorrect-password")

    expect(response).to have_http_status(:unprocessable_entity)
    expect(user.tenant_profiles.count).to eq(0)
  end

  describe "returning after sign-in" do
    let(:return_path) { "/artist/products/synth?variant=blue#details" }

    it "includes the original link in the JSON sign-in response" do
      post user_session_path(format: :json), params: {
        user: { email: user.email, password: password }, return_to: return_path
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["redirect_to"]).to eq(return_path)
    end

    it "returns to a protected link saved by the server after JSON sign-in" do
      get "/purchases/products?page=2"
      expect(response).to redirect_to(new_user_session_path)

      log_in

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["redirect_to"]).to eq("/purchases/products?page=2")
    end

    it "returns HTML sign-ins to the original link, including its query and fragment" do
      post user_session_path, params: {
        user: { email: user.email, password: password }, return_to: return_path
      }

      expect(response).to redirect_to(return_path)
    end

    it "uses home when a sign-in has no original link" do
      post user_session_path, params: { user: { email: user.email, password: password } }

      expect(response).to redirect_to(root_path)
    end

    ["https://example.com", "//example.com", "/\\example.com", "/users/sign_in", "/forgot-password"].each do |unsafe_path|
      it "ignores an unsafe return path #{unsafe_path.inspect}" do
        post user_session_path, params: {
          user: { email: user.email, password: password }, return_to: unsafe_path
        }

        expect(response).to redirect_to(root_path)
      end
    end

    context "with social sign-in" do
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

      %i[google_oauth2 discord].each do |provider|
        it "returns #{provider} sign-ins to the original link" do
          oauth2_mock(provider, email: user.email)

          post "/users/auth/#{provider}?return_to=#{CGI.escape(return_path)}"
          follow_redirect!

          expect(response).to redirect_to(return_path)
          get "/api/v1/me.json"
          expect(JSON.parse(response.body).dig("current_user", "id")).to eq(user.id)
        end
      end

      it "ignores external return links after social sign-in" do
        oauth2_mock(:google_oauth2, email: user.email)

        post "/users/auth/google_oauth2?return_to=https%3A%2F%2Fexample.com"
        follow_redirect!

        expect(response).to redirect_to(root_path)
      end
    end
  end

  it "renders the profile after successful JSON sign-up" do
    allow(User).to receive(:allow_unconfirmed_access_for).and_return(2.days)

    post user_registration_path(format: :json), params: {
      user: { username: "new-account", email: "new-account@example.com",
              password: password, password_confirmation: password }
    }, as: :json

    expect(response).to have_http_status(:ok)
    expect(response_user["username"]).to eq("new-account")
    expect(User.find(response_user["id"]).tenant_profile_for.username).to eq("new-account")
  end

  it "renders the tenant profile after updating an account through Devise" do
    user.tenant_profile_for.update!(display_name: "Tenant artist")
    sign_in user

    put user_registration_path(format: :json), params: {
      user: { username: "renamed-account", current_password: password }
    }, as: :json

    expect(response).to have_http_status(:ok)
    expect(response_user).to include("username" => "renamed-account", "display_name" => "Tenant artist")
  end

  it "repairs profiles for users who already have an authenticated session" do
    user.tenant_profiles.delete_all
    sign_in user

    get "/api/v1/me.json"

    expect(response).to have_http_status(:ok)
    expect(user.tenant_profile_for(Current.tenant)).to be_present
  end
end
