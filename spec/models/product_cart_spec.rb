require "rails_helper"

RSpec.describe ProductCart, type: :model do
  let(:cart) { described_class.create!(user: create(:user)) }

  it "does not offer pickup for an empty cart" do
    expect(cart).not_to be_pickup_available
  end

  it "requires every product to allow pickup" do
    cart.add_product(create(:product, allow_pickup: true))
    expect(cart).to be_pickup_available

    other_product = create(:product, allow_pickup: false)
    cart.add_product(other_product)
    expect(cart).not_to be_pickup_available

    other_product.update!(allow_pickup: true)
    expect(cart).to be_pickup_available
  end
end
