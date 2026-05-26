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
      output_path = File.join(output_dir, "premaster.wav")
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

      raise Error, "ffmpeg could not render the pre-master" unless status.success? && File.exist?(output_path)

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

      limit = db_to_amplitude(number(stage["ceiling_db"], -1.0)).round(6)
      ["alimiter=limit=#{limit}:level=false"]
    end

    def loudness_gain_db
      limiter = stage("limiter")
      target_lufs = number(recipe.dig("target", "target_lufs") || limiter&.dig("target_lufs"), nil)
      current_lufs = number(analysis_before["integrated_lufs"], nil)
      return 0.0 if target_lufs.blank? || current_lufs.blank?

      gain = target_lufs - current_lufs
      return gain if gain <= 0

      max_positive_gain = current_lufs >= -10.0 ? 0.5 : 4.0
      [gain, max_positive_gain].min
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
