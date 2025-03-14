FactoryBot.define do
  factory :participant do
    user { nil }
    conversation { nil }
    role { "MyString" }
  end
end
