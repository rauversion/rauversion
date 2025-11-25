FactoryBot.define do
  factory :event_ticket do
    title { "MyString" }
    price { "9.99" }
    early_bird_price { "9.99" }
    standard_price { "9.99" }
    qty { 1 }
    # selling_start { "2023-07-26 18:20:42" }
    # selling_end { "2023-07-26 18:20:42" }
    short_description { "MyString" }
    # settings { "" }
    event { nil }
    created_at { "2023-07-26 18:20:42" }
    updated_at { "2023-07-26 18:20:42" }

    transient do
      min_tickets_per_order { nil }
      max_tickets_per_order { nil }
      max_tickets_per_user { nil }
    end

    after(:build) do |event_ticket, evaluator|
      event_ticket.min_tickets_per_order = evaluator.min_tickets_per_order if evaluator.min_tickets_per_order
      event_ticket.max_tickets_per_order = evaluator.max_tickets_per_order if evaluator.max_tickets_per_order
      event_ticket.max_tickets_per_user = evaluator.max_tickets_per_user if evaluator.max_tickets_per_user
    end
  end
end
