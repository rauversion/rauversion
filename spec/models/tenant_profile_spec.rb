require "rails_helper"

RSpec.describe TenantProfile, type: :model do
  it "creates a membership and profile when a user is created within a tenant" do
    tenant = create(:tenant)
    Current.tenant = tenant

    user = create(:user)

    expect(user.membership_for(tenant)).to be_present
    expect(user.tenant_profile_for(tenant)).to have_attributes(username: user.username)
    expect(user.tenant_profile_for(Tenant.central)).to be_nil
  end

  it "uses the central tenant when users are created outside a request" do
    Current.tenant = nil

    user = create(:user)

    expect(user.membership_for(Tenant.central)).to be_present
    expect(user.tenant_profile_for(Tenant.central)).to have_attributes(username: user.username)
  end

  it "does not save an orphaned user if no tenant can be resolved" do
    Current.tenant = nil
    allow(Tenant).to receive(:central).and_raise(ActiveRecord::RecordNotFound)

    expect {
      expect { create(:user) }.to raise_error(ActiveRecord::RecordNotFound)
    }.not_to change(User, :count)
  end

  it "rolls back user creation when its profile cannot be created" do
    allow(described_class).to receive(:create_for_membership!).and_raise(ActiveRecord::RecordInvalid)
    membership_count = Membership.count

    expect {
      expect { create(:user) }.to raise_error(ActiveRecord::RecordInvalid)
    }.not_to change(User, :count)
    expect(Membership.count).to eq(membership_count)
  end

  it "preserves existing tenant data when profile creation is requested again" do
    user = create(:user)
    membership = user.membership_for
    profile = user.tenant_profile_for
    profile.update!(display_name: "Customized artist", bio: "Tenant biography")

    expect {
      expect(described_class.create_for_membership!(membership)).to eq(profile)
      expect(described_class.create_for_membership!(membership)).to eq(profile)
    }.not_to change(described_class, :count)
    expect(profile.reload).to have_attributes(display_name: "Customized artist", bio: "Tenant biography")
  end
end
