FactoryBot.define do
  factory :playlist do
    # user { nil }
    title { "MyString" }
    # slug { "MyString" }
    description { "MyText" }
    # metadata { "" }
    # private { false }
    playlist_type { "MyString" }
    release_date { "2023-07-24 14:02:23" }
    genre { "MyString" }
    custom_genre { "MyString" }
    likes_count { 1 }
  end
end
