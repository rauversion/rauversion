FactoryBot.define do
  factory :venue_review do
    venue { nil }
    user { nil }
    reviewer_role { "MyString" }
    overall_rating { "9.99" }
    aspects { "" }
    comment { "MyText" }
  end
end
