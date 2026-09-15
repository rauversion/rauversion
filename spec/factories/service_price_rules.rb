FactoryBot.define do
  factory :service_price_rule do
    association :service_product
    name { "Base price" }
    rule_type { "base" }
    amount { "100.00" }
    currency { "usd" }
    duration_minutes { 60 }
    location_scope { "online" }
    active { true }
    position { 0 }
  end
end
