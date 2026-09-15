require 'rails_helper'

RSpec.describe Product, type: :model do
  describe 'type immutability' do
    it 'does not allow changing the STI type after creation' do
      product = create(:service_product)

      product.type = 'Products::GearProduct'

      expect(product).not_to be_valid
      expect(product.errors[:type]).to be_present
    end
  end

  describe '#destroy_with_audit!' do
    it 'soft deletes the product and stores deletion audit data' do
      actor = create(:user)
      product = create(:service_product)

      product.destroy_with_audit!(actor: actor, reason: 'Replaced by a new service')

      archived_product = Product.with_deleted.find(product.id)
      expect(archived_product).to be_deleted
      expect(archived_product.deleted_by).to eq(actor)
      expect(archived_product.deletion_reason).to eq('Replaced by a new service')
      expect(Product.find_by(id: product.id)).to be_nil
    end

    it 'keeps service booking history attached to the archived product' do
      product = create(:service_product)
      booking = create(:service_booking, service_product: product)
      proposal = create(:service_booking_proposal, service_product: product, artist: product.user)
      price_rule = create(:service_price_rule, service_product: product)

      product.destroy_with_audit!(actor: product.user)

      archived_product = Products::ServiceProduct.with_deleted.find(product.id)
      expect(archived_product.service_bookings).to include(booking)
      expect(archived_product.service_booking_proposals).to include(proposal)
      expect(archived_product.service_price_rules).to include(price_rule)
    end
  end
end
