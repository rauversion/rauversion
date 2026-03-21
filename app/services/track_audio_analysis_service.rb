require "base64"
require "json"
require "open3"
require "tmpdir"
require "tempfile"
require "openai"

class TrackAudioAnalysisService
  class Error < StandardError; end

  ANALYSIS_FUNCTION_NAME = "submit_track_analysis".freeze
  DEFAULT_ANALYSIS_DURATION_SECONDS = 60
  MAX_ANALYSIS_DURATION_SECONDS = 90
  DEFAULT_MODEL = "gpt-audio".freeze
  CONFIDENCE_KEYS = %w[
    genre
    bpm
    mood
    reference_artists
    language
    key
    production_traits
  ].freeze

  def initialize(track:, start_seconds: 0, duration_seconds: DEFAULT_ANALYSIS_DURATION_SECONDS, persist: false, client: nil)
    @track = track
    @start_seconds = normalize_float(start_seconds)
    @duration_seconds = normalize_duration(duration_seconds)
    @persist = ActiveModel::Type::Boolean.new.cast(persist)
    @client = client || OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"], log_errors: true)
    @model = ENV.fetch("OPENAI_TRACK_ANALYSIS_MODEL", DEFAULT_MODEL)
  end

  def call
    validate_configuration!

    with_downloaded_track_file do |source_file|
      source_metadata = extract_source_metadata(source_file.path)
      clip_path = build_analysis_clip(source_file.path)
      analysis = request_analysis(clip_path, source_metadata)

      result = normalize_analysis(
        analysis: analysis,
        source_metadata: source_metadata
      )

      persist_analysis!(result) if persist?

      result
    ensure
      cleanup_generated_path(clip_path)
    end
  end

  private

  attr_reader :track, :start_seconds, :duration_seconds, :client, :model

  def validate_configuration!
    raise Error, "OPENAI_API_KEY is missing" if ENV["OPENAI_API_KEY"].blank?
    raise Error, "track is required" if track.blank?
    raise Error, "track has no analyzable audio" if analysis_attachment.blank?
  end

  def with_downloaded_track_file
    extension = File.extname(analysis_attachment.filename.to_s).presence || ".bin"
    tempfile = Tempfile.new(["track-analysis-source", extension])
    tempfile.binmode

    analysis_attachment.download do |chunk|
      tempfile.write(chunk)
    end

    tempfile.rewind
    yield(tempfile)
  ensure
    tempfile&.close
    tempfile&.unlink
  end

  def extract_source_metadata(source_path)
    stdout, stderr, status = Open3.capture3(
      ffprobe_path,
      "-v", "error",
      "-show_entries", "format=duration,bit_rate,format_name:stream=index,codec_type,codec_name,sample_rate,channels",
      "-of", "json",
      source_path
    )

    Rails.logger.info("TrackAudioAnalysisService ffprobe stderr=#{stderr}") if stderr.present?
    raise Error, "ffprobe could not read the track media" unless status.success?

    parsed = JSON.parse(stdout)
    audio_stream = Array(parsed["streams"]).find { |stream| stream["codec_type"] == "audio" }
    format = parsed["format"] || {}

    {
      track_id: track.id,
      track_title: track.title,
      attachment_name: analysis_attachment_name,
      filename: analysis_attachment.filename.to_s,
      content_type: analysis_attachment.content_type,
      format_name: format["format_name"],
      codec: audio_stream&.dig("codec_name"),
      duration_seconds: normalize_float(format["duration"]).round(2),
      bit_rate_kbps: kbps(format["bit_rate"]),
      sample_rate_hz: audio_stream&.dig("sample_rate")&.to_i,
      channels: audio_stream&.dig("channels")&.to_i
    }.compact
  rescue JSON::ParserError
    raise Error, "ffprobe returned invalid metadata"
  end

  def build_analysis_clip(source_path)
    dir = Dir.mktmpdir("track-analysis")
    output_path = File.join(dir, "analysis_fragment.mp3")

    args = [
      ffmpeg_path,
      "-hide_banner",
      "-loglevel", "error",
      "-y",
      "-ss", start_seconds.to_s,
      "-t", duration_seconds.to_s,
      "-i", source_path,
      "-vn",
      "-ac", "1",
      "-ar", "32000",
      "-b:a", "128k",
      output_path
    ]

    stdout, stderr, status = Open3.capture3(*args)

    Rails.logger.info("TrackAudioAnalysisService ffmpeg stdout=#{stdout}") if stdout.present?
    Rails.logger.info("TrackAudioAnalysisService ffmpeg stderr=#{stderr}") if stderr.present?

    raise Error, "ffmpeg could not generate an analysis clip" unless status.success? && File.exist?(output_path)

    output_path
  end

  def request_analysis(clip_path, source_metadata)
    response = client.chat(
      parameters: {
        model: model,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: system_prompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: user_prompt(source_metadata)
              },
              {
                type: "input_audio",
                input_audio: {
                  data: Base64.strict_encode64(File.binread(clip_path)),
                  format: "mp3"
                }
              }
            ]
          }
        ],
        tools: [analysis_tool],
        tool_choice: {
          type: "function",
          function: {
            name: ANALYSIS_FUNCTION_NAME
          }
        }
      }
    )

    tool_call = Array(response.dig("choices", 0, "message", "tool_calls")).find do |call|
      call.dig("function", "name") == ANALYSIS_FUNCTION_NAME
    end

    raise Error, "OpenAI did not return structured analysis data" if tool_call.blank?

    JSON.parse(tool_call.dig("function", "arguments").to_s)
  rescue JSON::ParserError
    raise Error, "OpenAI returned invalid JSON for track analysis"
  rescue StandardError => e
    raise e if e.is_a?(Error)

    raise Error, "OpenAI track analysis failed: #{e.message}"
  end

  def normalize_analysis(analysis:, source_metadata:)
    confidence_breakdown = normalize_confidence_breakdown(analysis["confidence_breakdown"])
    bpm = analysis["bpm"].to_f.round
    bpm = nil if bpm <= 0

    {
      accuracy: overall_accuracy(confidence_breakdown),
      genre: analysis["genre"].to_s.strip.presence,
      subgenres: normalize_array(analysis["subgenres"], limit: 4),
      bpm: bpm,
      bpm_range: normalize_bpm_range(analysis["bpm_range"], bpm),
      key: analysis["key"].to_s.strip.presence,
      mood: normalize_array(analysis["mood"], limit: 5),
      energy: clamp_unit_interval(analysis["energy"]),
      danceability: clamp_unit_interval(analysis["danceability"]),
      instrumental: ActiveModel::Type::Boolean.new.cast(analysis["instrumental"]),
      vocal_presence: clamp_unit_interval(analysis["vocal_presence"]),
      language: analysis["language"].to_s.strip.presence,
      primary_instruments: normalize_array(analysis["primary_instruments"], limit: 5),
      reference_artists: normalize_array(analysis["reference_artists"], limit: 5),
      production_traits: normalize_array(analysis["production_traits"], limit: 5),
      confidence_breakdown: confidence_breakdown,
      analysis_notes: analysis["analysis_notes"].to_s.strip.presence,
      analysis_window: {
        start_seconds: start_seconds.round(2),
        duration_seconds: effective_analysis_duration(source_metadata)
      },
      source_metadata: source_metadata,
      model: model
    }.compact
  end

  def persist_analysis!(result)
    attributes = {
      bpm: result[:bpm],
      subgenres: result[:subgenres],
      bpm_range: result[:bpm_range],
      musical_key: result[:key],
      mood: result[:mood],
      energy: result[:energy],
      danceability: result[:danceability],
      instrumental: result[:instrumental],
      vocal_presence: result[:vocal_presence],
      language: result[:language],
      primary_instruments: result[:primary_instruments],
      reference_artists: result[:reference_artists],
      production_traits: result[:production_traits],
      analysis_accuracy: result[:accuracy],
      analysis_notes: result[:analysis_notes],
      confidence_breakdown: result[:confidence_breakdown],
      analysis_window: result[:analysis_window],
      analysis_source_metadata: result[:source_metadata],
      analysis_model: result[:model],
      analyzed_at: Time.current
    }

    attributes[:genre] = result[:genre] if track.genre.to_s.strip.blank?

    track.update!(attributes)
  end

  def system_prompt
    <<~PROMPT
      You are a music metadata analyst for Rauversion.
      Analyze the provided audio fragment and infer musical traits from the sound only.
      Estimate genre, subgenres, tempo, key, mood, energy, danceability, instrumentation, vocals, and stylistic references.
      Never identify the exact song or claim certainty when the evidence is weak.
      If the fragment is ambiguous, lower confidence values and explain the ambiguity in analysis_notes.
      Reference artists should be stylistic comparisons, not copyright claims or exact matches.
    PROMPT
  end

  def user_prompt(source_metadata)
    <<~PROMPT
      Analyze this music fragment and call #{ANALYSIS_FUNCTION_NAME}.
      Technical context: #{source_metadata.to_json}
      Return only evidence-based estimates from the audio.
      Confidence values must be decimals between 0 and 1.
      If there are no vocals, omit language and keep vocal_presence near 0.
    PROMPT
  end

  def analysis_tool
    {
      type: "function",
      function: {
        name: ANALYSIS_FUNCTION_NAME,
        description: "Return structured music metadata inferred from an audio fragment",
        parameters: {
          type: "object",
          additionalProperties: false,
          required: [
            "genre",
            "subgenres",
            "bpm",
            "bpm_range",
            "mood",
            "energy",
            "danceability",
            "instrumental",
            "vocal_presence",
            "reference_artists",
            "primary_instruments",
            "production_traits",
            "confidence_breakdown",
            "analysis_notes"
          ],
          properties: {
            genre: {
              type: "string",
              description: "Most likely primary genre label"
            },
            subgenres: {
              type: "array",
              items: { type: "string" },
              description: "Up to four related subgenres"
            },
            bpm: {
              type: "number",
              description: "Estimated tempo in BPM"
            },
            bpm_range: {
              type: "object",
              additionalProperties: false,
              required: ["min", "max"],
              properties: {
                min: { type: "number" },
                max: { type: "number" }
              }
            },
            key: {
              type: "string",
              description: "Estimated musical key. Omit if unclear"
            },
            mood: {
              type: "array",
              items: { type: "string" }
            },
            energy: {
              type: "number",
              minimum: 0,
              maximum: 1
            },
            danceability: {
              type: "number",
              minimum: 0,
              maximum: 1
            },
            instrumental: {
              type: "boolean"
            },
            vocal_presence: {
              type: "number",
              minimum: 0,
              maximum: 1
            },
            language: {
              type: "string",
              description: "Language of the vocal if detectable. Omit if unclear"
            },
            primary_instruments: {
              type: "array",
              items: { type: "string" }
            },
            reference_artists: {
              type: "array",
              items: { type: "string" }
            },
            production_traits: {
              type: "array",
              items: { type: "string" }
            },
            confidence_breakdown: {
              type: "object",
              additionalProperties: false,
              required: CONFIDENCE_KEYS,
              properties: CONFIDENCE_KEYS.index_with do
                {
                  type: "number",
                  minimum: 0,
                  maximum: 1
                }
              end
            },
            analysis_notes: {
              type: "string",
              description: "One concise explanation of why this classification fits the excerpt"
            }
          }
        }
      }
    }
  end

  def normalize_confidence_breakdown(raw_breakdown)
    raw_breakdown = raw_breakdown.is_a?(Hash) ? raw_breakdown : {}

    CONFIDENCE_KEYS.index_with do |key|
      clamp_unit_interval(raw_breakdown[key] || raw_breakdown[key.to_sym] || 0)
    end
  end

  def overall_accuracy(confidence_breakdown)
    return 0 if confidence_breakdown.blank?

    (confidence_breakdown.values.sum / confidence_breakdown.size).round(2)
  end

  def normalize_bpm_range(raw_range, bpm)
    range = raw_range.is_a?(Hash) ? raw_range : {}
    min = normalize_float(range["min"] || range[:min])
    max = normalize_float(range["max"] || range[:max])

    min = bpm - 2 if min <= 0 && bpm.present?
    max = bpm + 2 if max <= 0 && bpm.present?

    return nil if min <= 0 || max <= 0

    {
      min: min.round,
      max: [max.round, min.round].max
    }
  end

  def normalize_array(value, limit:)
    Array(value)
      .map { |item| item.to_s.strip }
      .reject(&:blank?)
      .uniq
      .first(limit)
  end

  def effective_analysis_duration(source_metadata)
    source_duration = normalize_float(source_metadata[:duration_seconds] || source_metadata["duration_seconds"])
    return duration_seconds if source_duration <= 0

    [duration_seconds, [source_duration - start_seconds, 0].max].min.round(2)
  end

  def kbps(value)
    rate = normalize_float(value)
    return if rate <= 0

    (rate / 1000.0).round(2)
  end

  def normalize_float(value)
    Float(value)
  rescue ArgumentError, TypeError
    0.0
  end

  def normalize_duration(value)
    normalized = normalize_float(value)
    return DEFAULT_ANALYSIS_DURATION_SECONDS if normalized <= 0

    normalized.clamp(5, MAX_ANALYSIS_DURATION_SECONDS)
  end

  def clamp_unit_interval(value)
    normalize_float(value).clamp(0.0, 1.0).round(2)
  end

  def analysis_attachment
    @analysis_attachment ||= begin
      preferred_attachment = track.mp3_audio if track.respond_to?(:mp3_audio)
      if preferred_attachment&.attached?
        preferred_attachment
      else
        attachment = track.respond_to?(:analyzable_audio_media) ? track.analyzable_audio_media : nil
        attachment if attachment&.attached?
      end
    end
  end

  def persist?
    @persist
  end

  def analysis_attachment_name
    return "mp3_audio" if track.respond_to?(:mp3_audio) && track.mp3_audio&.attached?

    "audio"
  end

  def cleanup_generated_path(path)
    return if path.blank?

    dir = File.dirname(path)
    FileUtils.remove_entry(dir) if dir.start_with?(Dir.tmpdir) && Dir.exist?(dir)
  end

  def ffmpeg_path
    "ffmpeg"
  end

  def ffprobe_path
    "ffprobe"
  end
end
