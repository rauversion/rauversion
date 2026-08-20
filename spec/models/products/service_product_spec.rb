require 'rails_helper'

RSpec.describe Products::ServiceProduct, type: :model do
  describe 'service kind immutability' do
    it 'does not allow changing service kind after creation' do
      product = create(:service_product, service_kind: 'performance', category: 'dj_set')

      product.service_kind = 'education'

      expect(product).not_to be_valid
      expect(product.errors[:service_kind]).to be_present
    end
  end

  describe 'performance booking defaults' do
    it 'uses proposal and venue-friendly defaults for performers' do
      product = build(
        :service_product,
        service_kind: 'performance',
        category: 'dj_set',
        booking_mode: 'instant_checkout',
        delivery_method: 'online'
      )

      product.validate

      expect(product.booking_mode).to eq('deposit_then_balance')
      expect(product.delivery_method).to eq('in_person')
      expect(product.errors[:booking_mode]).to be_empty
      expect(product.errors[:delivery_method]).to be_empty
    end
  end
end
