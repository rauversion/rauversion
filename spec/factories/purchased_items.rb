FactoryBot.define do
  factory :purchased_item do
    purchase { nil }
    purchased_item { nil }
    price { 0 }
    currency { 'usd' }
  end
end
