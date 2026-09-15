FactoryBot.define do
  factory :release do
    association :playlist
    tenant { playlist.tenant }
    user { playlist.user }
    sequence(:title) { |number| "Release #{number}" }
  end
end
