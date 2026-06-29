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

    factory :service_product, class: "Products::ServiceProduct" do
      association :user
      category { "coaching" }
      service_kind { "advisory" }
      booking_mode { "instant_checkout" }
      delivery_method { "online" }
      duration_minutes { 60 }
      max_participants { 1 }
    end
  end
end
