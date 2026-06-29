FactoryBot.define do
  factory :service_booking do
    association :service_product
    association :customer, factory: :user
    association :provider, factory: :user
    status { "pending_confirmation" }
    payment_status { "paid" }
    refund_status { "not_requested" }
    currency { "usd" }
    subtotal_amount { "100.00" }
    total_amount { "100.00" }
  end
end
