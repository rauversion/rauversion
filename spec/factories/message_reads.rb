FactoryBot.define do
  factory :message_read do
    association :message
    association :participant
    read_at { Time.current }
  end
end
