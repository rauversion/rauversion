FactoryBot.define do
  factory :track_playlist do
    association :playlist
    track { association(:track, tenant: playlist.tenant) }
    user { nil }
    track { nil }
  end
end
