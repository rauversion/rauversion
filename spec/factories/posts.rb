FactoryBot.define do
  factory :post do
    association :user
    body { { "content" => [] } }
    settings { {} }
    private { false }
    excerpt { "MyText" }
    sequence(:title) { |n| "Post Title #{n}" }
    state { "draft" }

    trait :published do
      state { "published" }
      private { false }
    end
  end
end
