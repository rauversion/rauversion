FactoryBot.define do
  factory :tenant do
    sequence(:name) { |number| "Tenant #{number}" }
    sequence(:slug) { |number| "tenant-#{number}" }
    central { false }
  end
end
