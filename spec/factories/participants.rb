FactoryBot.define do
  factory :participant do
    association :user
    association :conversation
    role { "member" }
  end
end
