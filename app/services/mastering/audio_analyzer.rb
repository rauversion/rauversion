require "json"
require "open3"

module Mastering
  class AudioAnalyzer
    class Error < StandardError; end

    def initialize(input_path:)
      @input_path = input_path
    end

    def call
      metadata = probe_metadata
      ebur128 = analyze_ebur128
      astats = analyze_astats

      sample_peak = astats[:sample_peak_dbfs]
      true_peak = ebur128[:true_peak_dbfs] || sample_peak

      {
        duration_sec: metadata[:duration_sec],
        sample_rate_hz: metadata[:sample_rate_hz],
        channels: metadata[:channels],
        integrated_lufs: ebur128[:integrated_lufs],
        true_peak_dbfs: true_peak,
        sample_peak_dbfs: sample_peak,
        clipping_detected: clipping_detected?(sample_peak, true_peak),
        dc_offset: astats[:dc_offset],
        crest_factor_db: astats[:crest_factor_db],
        spectral_notes: {}
      }.compact
    end

    private

    attr_reader :input_path

    def probe_metadata
      stdout, stderr, status = Open3.capture3(
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration:stream=codec_type,sample_rate,channels",
        "-of", "json",
        input_path
      )

      raise Error, "ffprobe could not read audio metadata: #{stderr.presence || "unknown error"}" unless status.success?

      parsed = JSON.parse(stdout)
      audio_stream = Array(parsed["streams"]).find { |stream| stream["codec_type"] == "audio" } || {}
      format = parsed["format"] || {}

      {
        duration_sec: number(format["duration"])&.round(2),
        sample_rate_hz: audio_stream["sample_rate"]&.to_i,
        channels: audio_stream["channels"]&.to_i
      }
    rescue JSON::ParserError
      raise Error, "ffprobe returned invalid JSON"
    end

    def analyze_ebur128
      _stdout, stderr, status = Open3.capture3(
        "ffmpeg",
        "-hide_banner",
        "-nostats",
        "-i", input_path,
        "-filter_complex", "ebur128=peak=true",
        "-f", "null",
        "-"
      )

      return {} unless status.success?

      summary = stderr.to_s.split("Summary:").last.to_s
      integrated = summary[/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/, 1]
      true_peaks = summary.scan(/Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/)

      {
        integrated_lufs: number(integrated),
        true_peak_dbfs: number(true_peaks.last&.first)
      }.compact
    end

    def analyze_astats
      _stdout, stderr, status = Open3.capture3(
        "ffmpeg",
        "-hide_banner",
        "-nostats",
        "-i", input_path,
        "-af", "astats=metadata=1:reset=0",
        "-f", "null",
        "-"
      )

      return {} unless status.success?

      {
        dc_offset: number(stderr.scan(/DC offset:\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i).last&.first)&.round(6),
        sample_peak_dbfs: number(stderr.scan(/Peak level dB:\s*(-?(?:inf|\d+(?:\.\d+)?))/i).last&.first),
        crest_factor_db: crest_factor_db(stderr)
      }.compact
    end

    def crest_factor_db(output)
      crest_factor = number(output.scan(/Crest factor:\s*(\d+(?:\.\d+)?)/i).last&.first)
      return if crest_factor.blank? || crest_factor <= 0

      (20.0 * Math.log10(crest_factor)).round(2)
    end

    def clipping_detected?(sample_peak, true_peak)
      [sample_peak, true_peak].compact.any? { |peak| peak >= -0.1 }
    end

    def number(value)
      return if value.blank?
      return if value.to_s.downcase.end_with?("inf")

      Float(value)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
