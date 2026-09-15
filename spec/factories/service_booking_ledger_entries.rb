FactoryBot.define do
  factory :service_booking_ledger_entry do
    association :service_booking
    entry_type { "booking_created" }
    milestone { "booking" }
    direction { "neutral" }
    amount { 100 }
    currency { "usd" }
    occurred_at { Time.current }
  end
end
