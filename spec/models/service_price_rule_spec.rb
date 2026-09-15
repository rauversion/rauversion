require "rails_helper"

RSpec.describe ServicePriceRule, type: :model do
  subject(:rule) { build(:service_price_rule) }

  it { is_expected.to belong_to(:service_product).class_name("Products::ServiceProduct") }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:currency) }
  it { is_expected.to validate_numericality_of(:amount).is_greater_than_or_equal_to(0) }
end
