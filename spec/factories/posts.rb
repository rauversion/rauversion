FactoryBot.define do
  factory :post do
    tenant { Current.tenant || association(:tenant) }
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
