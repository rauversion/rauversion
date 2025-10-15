FactoryBot.define do
  factory :venue do
    name { "MyString" }
    city { "MyString" }
    country { "MyString" }
    rating { "9.99" }
    review_count { 1 }
    genres { "MyString" }
    capacity { 1 }
    price_range { "MyString" }
    description { "MyText" }
    address { "MyString" }
    lat { "9.99" }
    lng { "9.99" }
    slug { "MyString" }
    image_url { "MyText" }
  end
end
