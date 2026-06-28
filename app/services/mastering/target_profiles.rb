module Mastering
  class TargetProfile
    ATTRIBUTES = %i[
      key
      label_es
      target_lufs
      true_peak_ceiling_db
      style_es
      highpass_frequency_hz
      limiter_enabled
      limiter_max_gain_reduction_db
      already_mastered_limiter_max_gain_reduction_db
      loudness_correction_limit_db
      max_loudness_correction_passes
      minimum_crest_factor_db
      max_positive_gain_db
      loud_source_gain_cap_db
      true_peak_safety_margin_db
    ].freeze

    attr_reader(*ATTRIBUTES)

    def initialize(**attributes)
      ATTRIBUTES.each do |attribute|
        instance_variable_set("@#{attribute}", attributes.fetch(attribute))
      end
    end

    def [](attribute)
      public_send(attribute)
    end

    def vinyl_premaster?
      key == "vinyl_premaster"
    end

    def limiter_gain_reduction_db(already_mastered:)
      return 0.0 unless limiter_enabled
      return already_mastered_limiter_max_gain_reduction_db if already_mastered

      limiter_max_gain_reduction_db
    end

    def to_h
      ATTRIBUTES.index_with { |attribute| public_send(attribute) }
    end
  end

  class TargetProfiles
    PROFILES = {
      "streaming_clean" => TargetProfile.new(
        key: "streaming_clean",
        label_es: "Streaming clean",
        target_lufs: -14.0,
        true_peak_ceiling_db: -1.0,
        style_es: "Limpio, dinámico y seguro para plataformas.",
        highpass_frequency_hz: 25,
        limiter_enabled: true,
        limiter_max_gain_reduction_db: 4.0,
        already_mastered_limiter_max_gain_reduction_db: 1.0,
        loudness_correction_limit_db: 1.5,
        max_loudness_correction_passes: 2,
        minimum_crest_factor_db: 11.5,
        max_positive_gain_db: 10.0,
        loud_source_gain_cap_db: 1.5,
        true_peak_safety_margin_db: 0.5
      ),
      "club_loud" => TargetProfile.new(
        key: "club_loud",
        label_es: "Club loud",
        target_lufs: -9.0,
        true_peak_ceiling_db: -0.7,
        style_es: "Fuerte y energético, cuidando transientes y evitando clipping.",
        highpass_frequency_hz: 25,
        limiter_enabled: true,
        limiter_max_gain_reduction_db: 9.0,
        already_mastered_limiter_max_gain_reduction_db: 1.0,
        loudness_correction_limit_db: 4.0,
        max_loudness_correction_passes: 3,
        minimum_crest_factor_db: 10.0,
        max_positive_gain_db: 16.0,
        loud_source_gain_cap_db: 1.5,
        true_peak_safety_margin_db: 0.5
      ),
      "demo_balanced" => TargetProfile.new(
        key: "demo_balanced",
        label_es: "Demo balanced",
        target_lufs: -11.5,
        true_peak_ceiling_db: -1.0,
        style_es: "Presentable y balanceado, sin limitar de más.",
        highpass_frequency_hz: 25,
        limiter_enabled: true,
        limiter_max_gain_reduction_db: 5.0,
        already_mastered_limiter_max_gain_reduction_db: 1.0,
        loudness_correction_limit_db: 2.0,
        max_loudness_correction_passes: 2,
        minimum_crest_factor_db: 10.8,
        max_positive_gain_db: 12.0,
        loud_source_gain_cap_db: 1.5,
        true_peak_safety_margin_db: 0.5
      ),
      "vinyl_premaster" => TargetProfile.new(
        key: "vinyl_premaster",
        label_es: "Vinyl premaster",
        target_lufs: -15.0,
        true_peak_ceiling_db: -3.0,
        style_es: "Conservador, con headroom y sin hard limiting.",
        highpass_frequency_hz: 30,
        limiter_enabled: false,
        limiter_max_gain_reduction_db: 0.0,
        already_mastered_limiter_max_gain_reduction_db: 0.0,
        loudness_correction_limit_db: 0.0,
        max_loudness_correction_passes: 0,
        minimum_crest_factor_db: nil,
        max_positive_gain_db: 0.0,
        loud_source_gain_cap_db: 0.0,
        true_peak_safety_margin_db: 0.5
      )
    }.freeze

    def self.all
      PROFILES
    end

    def self.key?(key)
      PROFILES.key?(key.to_s)
    end

    def self.fetch(key)
      PROFILES.fetch(key.to_s, PROFILES.fetch("demo_balanced"))
    end
  end
end
