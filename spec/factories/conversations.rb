FactoryBot.define do
  factory :conversation do
    subject { "MyString" }
    messageable { nil }
    status { "MyString" }
  end
end
