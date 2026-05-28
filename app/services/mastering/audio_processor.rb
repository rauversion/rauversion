require "fileutils"
require "open3"
require "tmpdir"

module Mastering
  class AudioProcessor
    class Error < StandardError; end

    def initialize(input_path:, recipe:, analysis_before:)
      @input_path = input_path
      @recipe = (recipe || {}).deep_stringify_keys
      @analysis_before = (analysis_before || {}).deep_stringify_keys
    end

    def call
      output_dir = Dir.mktmpdir("rauversion-master")
      output_path = File.join(output_dir, "master.wav")
      filters = filter_chain

      args = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", input_path,
        "-vn"
      ]
      args += ["-filter:a", filters] if filters.present?
      args += [
        "-ar", export_sample_rate.to_s,
        "-ac", "2",
        "-c:a", "pcm_s24le",
        output_path
      ]

      stdout, stderr, status = Open3.capture3(*args)
      Rails.logger.info("Mastering::AudioProcessor stdout=#{stdout}") if stdout.present?
      Rails.logger.warn("Mastering::AudioProcessor stderr=#{stderr}") if stderr.present?

      raise Error, "ffmpeg could not render the master" unless status.success? && File.exist?(output_path)

      output_path
    rescue StandardError
      FileUtils.remove_entry(output_dir) if output_dir.present? && Dir.exist?(output_dir)
      raise
    end

    private

    attr_reader :input_path, :recipe, :analysis_before

    def filter_chain
      filters = []
      filters.concat(highpass_filters)
      filters.concat(eq_filters)
      filters.concat(lowpass_filters)
      filters.concat(compressor_filters)
      filters.concat(saturation_filters)
      filters.concat(gain_filters)
      filters.concat(limiter_filters)
      filters << "aresample=dither_method=triangular" if recipe.dig("export", "dither")
      filters.join(",")
    end

    def highpass_filters
      stage = stage("highpass_filter")
      return [] unless stage&.fetch("enabled", false)

      ["highpass=f=#{number(stage["frequency_hz"], 25).round(2)}"]
    end

    def eq_filters
      stage = stage("eq")
      return [] unless stage&.fetch("enabled", false)

      Array(stage["bands"]).filter_map do |band|
        frequency = number(band["frequency_hz"], 1000).round(2)
        gain = number(band["gain_db"], 0).round(2)
        q = number(band["q"], 0.7).round(2)

        case band["filter"]
        when "low_shelf"
          "bass=f=#{frequency}:g=#{gain}:width_type=q:width=#{q}"
        when "high_shelf"
          "treble=f=#{frequency}:g=#{gain}:width_type=q:width=#{q}"
        when "bell"
          "equalizer=f=#{frequency}:t=q:w=#{q}:g=#{gain}"
        end
      end
    end

    def lowpass_filters
      stage = stage("lowpass_filter")
      return [] unless stage&.fetch("enabled", false)

      frequency = number(stage["frequency_hz"], 12_000).round(2)
      ["lowpass=f=#{frequency}"]
    end

    def compressor_filters
      stage = stage("bus_compressor")
      return [] unless stage&.fetch("enabled", false)

      threshold = db_to_amplitude(number(stage["threshold_db"], -18)).round(6)
      ratio = number(stage["ratio"], 1.4).round(2)
      attack = number(stage["attack_ms"], 30).round(2)
      release = number(stage["release_ms"], 160).round(2)
      makeup = db_to_amplitude(number(stage["makeup_gain_db"], 0)).round(6)
      mix = (number(stage["mix_percent"], 40) / 100.0).clamp(0.0, 1.0).round(2)

      ["acompressor=threshold=#{threshold}:ratio=#{ratio}:attack=#{attack}:release=#{release}:makeup=#{makeup}:mix=#{mix}"]
    end

    def saturation_filters
      stage = stage("saturation")
      return [] unless stage&.fetch("enabled", false)

      drive = db_to_amplitude(number(stage["drive_db"], 0.4)).round(6)
      ["asoftclip=type=tanh:param=#{drive}"]
    end

    def gain_filters
      gain = loudness_gain_db
      return [] if gain.abs < 0.05

      ["volume=#{gain.round(2)}dB"]
    end

    def limiter_filters
      stage = stage("limiter")
      return [] unless stage&.fetch("enabled", false)

      limit = db_to_amplitude(limiter_sample_ceiling_db(stage)).round(6)
      [
        "aresample=192000",
        "alimiter=limit=#{limit}:level=false",
        "aresample=#{export_sample_rate}"
      ]
    end

    def loudness_gain_db
      limiter = stage("limiter")
      target_lufs = number(recipe.dig("target", "target_lufs") || limiter&.dig("target_lufs"), nil)
      current_lufs = number(analysis_before["integrated_lufs"], nil)
      return 0.0 if target_lufs.blank? || current_lufs.blank?

      gain = target_lufs - current_lufs
      return gain + loudness_offset_db if gain <= 0

      max_positive_gain = max_positive_gain_db(current_lufs, limiter)
      [gain, max_positive_gain].min + loudness_offset_db
    end

    def max_positive_gain_db(current_lufs, limiter)
      profile = recipe.dig("target", "profile").to_s
      return 0.0 if profile == "vinyl_premaster"

      # Masters should be allowed to reach the profile target. The previous
      # +4 dB cap was appropriate for premaster safety, but left quiet mixes far
      # below club/demo targets.
      profile_cap = case profile
                    when "club_loud" then 16.0
                    when "demo_balanced" then 12.0
                    when "streaming_clean" then 10.0
                    else 10.0
                    end

      return [profile_cap, 1.5].min if current_lufs >= -10.0

      [profile_cap, peak_safe_gain_cap(limiter)].compact.min
    end

    def peak_safe_gain_cap(limiter)
      return unless limiter&.fetch("enabled", false)

      current_true_peak = number(analysis_before["true_peak_dbfs"], nil)
      return if current_true_peak.blank?

      max_gain_reduction = number(limiter["max_gain_reduction_db"], 6.0)
      limiter_sample_ceiling_db(limiter) - current_true_peak + max_gain_reduction
    end

    def limiter_sample_ceiling_db(limiter)
      number(limiter["ceiling_db"], -1.0) - true_peak_safety_margin_db
    end

    def true_peak_safety_margin_db
      0.5
    end

    def loudness_offset_db
      number(recipe.dig("render_adjustments", "loudness_offset_db"), 0.0).clamp(-6.0, 6.0)
    end

    def stage(type)
      Array(recipe["processing_chain"]).find { |item| item["type"] == type }
    end

    def export_sample_rate
      number(recipe.dig("export", "sample_rate_hz"), 44_100).to_i
    end

    def db_to_amplitude(db)
      10.0**(db.to_f / 20.0)
    end

    def number(value, fallback = 0.0)
      return fallback if value.blank?

      Float(value)
    rescue ArgumentError, TypeError
      fallback
    end
  end
end
