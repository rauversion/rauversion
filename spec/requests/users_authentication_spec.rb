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
