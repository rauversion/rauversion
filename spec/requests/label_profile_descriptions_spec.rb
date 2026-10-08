require "rails_helper"

RSpec.describe "Label profile descriptions", type: :request do
  let(:label) { create(:user, role: :artist, label: true, bio: "Original label description", confirmed_at: Time.current) }
  let(:artist) { create(:user, role: :artist, bio: "Original artist description", confirmed_at: Time.current) }
  let(:profile) { artist.tenant_profile_for(Current.tenant) }

  it "allows the label to edit its own description" do
    sign_in label

    get user_path(label.username, format: :json)
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig("user", "can_edit_description")).to eq(true)

    update_description(label, bio: "Independent electronic music label")

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to eq("bio" => "Independent electronic music label")
    expect(label.tenant_profile_for(Current.tenant).bio).to eq("Independent electronic music label")
  end

  it "allows an active label to edit an artist's description without changing their account" do
    create(:connected_account, parent: label, user: artist, state: "active")
    sign_in label
    original_email = artist.email
    original_username = artist.username

    get user_path(artist.username, format: :json)
    expect(JSON.parse(response.body).dig("user", "can_edit_description")).to eq(true)

    update_description(artist,
      bio: "Live electronic music.\nBased in Santiago.",
      email: "changed@example.com", username: "changed-username", role: "admin", label: true,
      display_name: "Changed name"
    )

    expect(response).to have_http_status(:ok)
    expect(profile.reload.bio).to eq("Live electronic music.\nBased in Santiago.")
    expect(profile.username).to eq(original_username)
    expect(artist.reload).to have_attributes(
      email: original_email, username: original_username, role: "artist", label: nil,
      bio: "Original artist description"
    )
    expect(label.reload.bio).to eq("Original label description")

    get user_path(artist.username, format: :json)
    expect(JSON.parse(response.body).dig("user", "bio")).to eq("Live electronic music.\nBased in Santiago.")
  end

  it "allows clearing the description" do
    create(:connected_account, parent: label, user: artist, state: "active")
    sign_in label

    update_description(artist, bio: "")

    expect(response).to have_http_status(:ok)
    expect(profile.reload.bio).to eq("")
  end

  it "uses the tenant profile username when it differs from the account username" do
    create(:connected_account, parent: label, user: artist, state: "active")
    profile.update!(username: "local-artist-name")
    sign_in label

    patch profile_description_path("local-artist-name", format: :json), params: { user: { bio: "Local description" } }, as: :json

    expect(response).to have_http_status(:ok)
    expect(profile.reload.bio).to eq("Local description")
  end

  it "does not change descriptions in other tenants" do
    other_tenant = create(:tenant)
    artist.memberships.create!(tenant: other_tenant, role: "artist")
    other_profile = artist.tenant_profile_for(other_tenant)
    other_profile.update!(bio: "Description on another site")
    create(:connected_account, parent: label, user: artist, state: "active")
    sign_in label

    update_description(artist, bio: "Updated here")

    expect(response).to have_http_status(:ok)
    expect(profile.reload.bio).to eq("Updated here")
    expect(other_profile.reload.bio).to eq("Description on another site")
  end

  it "does not expose the editor to guests and requires authentication to save" do
    get user_path(artist.username, format: :json)
    expect(JSON.parse(response.body).dig("user", "can_edit_description")).to eq(false)

    update_description(artist, bio: "Unauthorized change")

    expect(response).to redirect_to(new_user_session_path(format: :json))
    expect(profile.reload.bio).to eq("Original artist description")
  end

  it "rejects a label without an artist connection" do
    sign_in label

    get user_path(artist.username, format: :json)
    expect(JSON.parse(response.body).dig("user", "can_edit_description")).to eq(false)

    update_description(artist, bio: "Unauthorized change")

    expect(response).to have_http_status(:forbidden)
    expect(profile.reload.bio).to eq("Original artist description")
  end

  %w[pending revoked].each do |state|
    it "rejects a #{state} artist connection" do
      create(:connected_account, parent: label, user: artist, state: state)
      sign_in label

      get user_path(artist.username, format: :json)
      expect(JSON.parse(response.body).dig("user", "can_edit_description")).to eq(false)

      update_description(artist, bio: "Unauthorized change")

      expect(response).to have_http_status(:forbidden)
      expect(profile.reload.bio).to eq("Original artist description")
    end
  end

  it "rejects a connected account that is not a label" do
    label.update!(label: false)
    create(:connected_account, parent: label, user: artist, state: "active")
    sign_in label

    update_description(artist, bio: "Unauthorized change")

    expect(response).to have_http_status(:forbidden)
    expect(profile.reload.bio).to eq("Original artist description")
  end

  it "leaves an ordinary artist's own description editor in the existing settings" do
    sign_in artist

    get user_path(artist.username, format: :json)
    expect(JSON.parse(response.body).dig("user", "can_edit_description")).to eq(false)

    update_description(artist, bio: "Unauthorized change")
    expect(response).to have_http_status(:forbidden)
  end

  it "rejects a label that has no membership in the target site" do
    other_tenant = create(:tenant, slug: "artist-site")
    artist.memberships.create!(tenant: other_tenant, role: "artist")
    other_profile = artist.tenant_profile_for(other_tenant)
    create(:connected_account, parent: label, user: artist, state: "active")
    allow(TenantSubscriptions).to receive(:disabled?).and_return(true)
    host! "artist-site.example.com"
    sign_in label

    update_description(artist, bio: "Unauthorized change")

    expect(response).to have_http_status(:forbidden)
    expect(other_profile.reload.bio).to eq("Original artist description")
    expect(label.membership_for(other_tenant)).to be_nil
  end

  def update_description(user, attributes)
    patch profile_description_path(user.username, format: :json), params: { user: attributes }, as: :json
  end
end
