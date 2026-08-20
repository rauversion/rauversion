FactoryBot.define do
  factory :service_booking_proposal do
    association :booker, factory: :user
    association :service_product, factory: :service_product
    artist { service_product.user }
    current_offer_by { booker }
    event_name { "Club Night" }
    event_date { 2.weeks.from_now.to_date }
    venue_name { "Club Rau" }
    city { "Santiago" }
    proposed_amount { 600_000 }
    currency { "clp" }
    deposit_percentage { 50 }
    fee_type { "landed" }
    message { "We would like to book your DJ set." }
  end
end
