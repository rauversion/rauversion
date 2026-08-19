FactoryBot.define do
  factory :track do
    tenant { Current.tenant || association(:tenant) }
    association :user
    sequence(:title) { |n| "title-#{n}" }
    private { false }
    caption { "MyString" }
    likes_count { 1 }
    reposts_count { 1 }
    tags { [] }
  end
end
