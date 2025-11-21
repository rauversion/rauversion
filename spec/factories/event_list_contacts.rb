FactoryBot.define do
  factory :event_list_contact do
    email { "contact@example.com" }
    name { "John Doe" }
    first_name { "John" }
    last_name { "Doe" }
    dni { "12345678" }
    country { "US" }
    event_list { nil }
  end
end
