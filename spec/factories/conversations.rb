FactoryBot.define do
  factory :conversation do
    subject { "Test Conversation" }
    association :messageable, factory: :user
    status { "active" }
  end
end
