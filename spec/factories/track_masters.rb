FactoryBot.define do
  factory :track_master do
    track { association(:track, user: association(:user)) }
    target_profile { "demo_balanced" }
    state { "pending" }
    feedback { "Mantener pegada y limpiar un poco el subgrave." }
    reference_notes { "" }
  end
end
