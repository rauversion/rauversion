FactoryBot.define do
  factory :course do
    user { nil }
    title { "MyString" }
    description { "MyText" }
    category { "MyString" }
    level { "MyString" }
    duration { "MyString" }
    price { "9.99" }
    instructor { "MyString" }
    instructor_title { "MyString" }
    is_published { false }
  end
end
