FactoryBot.define do
  factory :product do
    tenant { Current.tenant || association(:tenant) }
    association :user
    title { "MyString" }
    description { "MyText" }
    price { "9.99" }
    stock_quantity { 1 }
    sku { "MyString" }
    category { "MyString" }
    status { "active" }
  end
end
