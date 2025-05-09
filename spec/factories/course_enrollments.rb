FactoryBot.define do
  factory :course_enrollment do
    user { nil }
    course { nil }
    progress { "" }
  end
end
