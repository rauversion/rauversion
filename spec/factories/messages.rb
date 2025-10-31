FactoryBot.define do
  factory :message do
    body { "MyText" }
    association :conversation
    association :user
    message_type { "text" }
  end
end
