FactoryBot.define do
  factory :press_kit do
    association :user
    bio { "Artist biography and background information" }
    press_release { "Latest press release content" }
    technical_rider { "Technical requirements for performances" }
    stage_plot { "Stage layout and setup information" }
    booking_info { "Contact: booking@artist.com" }
    published { true }
    settings { { video_urls: [], featured_track_ids: [], featured_playlist_ids: [] } }
  end
end
