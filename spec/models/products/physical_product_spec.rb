require "rails_helper"

RSpec.describe Products::PhysicalProduct, type: :model do
  let(:product) do
    described_class.new(attributes_for(:product).merge(user: create(:user), tenant: Current.tenant))
  end

  it "requires shipping details when pickup is disabled" do
    expect(product).not_to be_valid
    expect(product.errors[:product_shippings]).to be_present
    expect(product.errors[:shipping_days]).to be_present
  end

  it "allows a pickup-only product without shipping rates or shipping days" do
    product.allow_pickup = true

    expect(product).to be_valid
    product.save!
    expect(product.reload).to be_pickup_only
  end

  it "still requires shipping days when pickup and shipping are both offered" do
    product.allow_pickup = true
    product.product_shippings.build(country: "CL", base_cost: 3_000, additional_cost: 0)

    expect(product).not_to be_valid
    expect(product.errors[:shipping_days]).to be_present
    product.shipping_days = 3
    expect(product).to be_valid
  end

  it "allows removing all shipping options to switch to pickup only" do
    product.allow_pickup = true
    product.shipping_days = 3
    product.product_shippings.build(country: "CL", base_cost: 3_000, additional_cost: 0)
    product.save!

    product.shipping_days = nil
    product.product_shippings.first.mark_for_destruction

    expect(product).to be_valid
  end
end
