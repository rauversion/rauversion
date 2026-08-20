require "rails_helper"

RSpec.describe TenantAccessPolicy do
  let(:tenant) { create(:tenant) }
  let(:subscriber) { create(:user) }
  let(:plan) do
    Plan.create!(
      code: "spec_plan",
      name: "Spec plan",
      entitlements: {
        tenant_access: true,
        custom_domain: true,
        max_members: 5
      }
    )
  end
  let(:plan_price) do
    PlanPrice.create!(
      plan: plan,
      provider: "stripe",
      currency: "usd",
      amount_cents: 1_000,
      billing_interval: "month"
    )
  end

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch)
      .with("DISABLE_TENANT_SUBSCRIPTION", anything)
      .and_return("false")
  end

  it "always allows the central tenant" do
    expect(described_class.new(Tenant.central)).to be_accessible
  end

  it "returns false for a tenant without a subscription" do
    expect(described_class.new(tenant).accessible?).to be(false)
  end

  it "allows access when subscriptions are disabled" do
    allow(ENV).to receive(:fetch)
      .with("DISABLE_TENANT_SUBSCRIPTION", anything)
      .and_return("true")

    expect(described_class.new(tenant)).to be_accessible
  end

  it "allows an active subscription and reads its entitlement snapshot" do
    create_subscription(status: "active")
    policy = described_class.new(tenant)

    expect(policy).to be_accessible
    expect(policy).to be_entitled(:custom_domain)
    expect(policy.limit(:max_members)).to eq(5)
  end

  it "allows a past due subscription during its grace period" do
    create_subscription(status: "past_due", grace_period_ends_at: 2.days.from_now)

    expect(described_class.new(tenant)).to be_accessible
  end

  it "blocks a past due subscription after its grace period" do
    create_subscription(status: "past_due", grace_period_ends_at: 2.days.ago)

    expect(described_class.new(tenant).accessible?).to be(false)
  end

  def create_subscription(status:, grace_period_ends_at: nil)
    TenantSubscription.create!(
      tenant: tenant,
      subscriber: subscriber,
      plan: plan,
      plan_price: plan_price,
      status: status,
      grace_period_ends_at: grace_period_ends_at
    )
  end
end
