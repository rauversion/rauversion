FactoryBot.define do
  factory :message do
    body { "MyText" }
    conversation { nil }
    user { nil }
    message_type { "MyString" }
  end
end
