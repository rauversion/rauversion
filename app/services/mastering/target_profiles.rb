module Mastering
  class TargetProfiles
    PROFILES = {
      "streaming_clean" => {
        label_es: "Streaming clean",
        target_lufs: -14.0,
        true_peak_ceiling_db: -1.0,
        style_es: "Limpio, dinámico y seguro para plataformas."
      },
      "club_loud" => {
        label_es: "Club loud",
        target_lufs: -9.0,
        true_peak_ceiling_db: -0.7,
        style_es: "Fuerte y energético, cuidando transientes y evitando clipping."
      },
      "demo_balanced" => {
        label_es: "Demo balanced",
        target_lufs: -11.5,
        true_peak_ceiling_db: -1.0,
        style_es: "Presentable y balanceado, sin limitar de más."
      },
      "vinyl_premaster" => {
        label_es: "Vinyl premaster",
        target_lufs: -15.0,
        true_peak_ceiling_db: -3.0,
        style_es: "Conservador, con headroom y sin hard limiting."
      }
    }.freeze

    def self.all
      PROFILES
    end

    def self.fetch(key)
      PROFILES.fetch(key.to_s, PROFILES.fetch("demo_balanced"))
    end
  end
end
