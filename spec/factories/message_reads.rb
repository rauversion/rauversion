FactoryBot.define do
  factory :message_read do
    message { nil }
    participant { nil }
    read_at { Time.current }
  end
end
