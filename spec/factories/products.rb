FactoryBot.define do
  factory :product do
    title { "MyString" }
    description { "MyText" }
    price { "9.99" }
    stock_quantity { 1 }
    sku { "MyString" }
    category { "MyString" }
    status { "active" }
    user { nil }
  end
end
