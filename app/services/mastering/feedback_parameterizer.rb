require "json"
require "openai"

module Mastering
  class FeedbackParameterizer
    class Error < StandardError; end

    FUNCTION_NAME = "submit_mastering_feedback_parameters".freeze
    DEFAULT_MODEL = "gpt-4o-mini".freeze
    MAX_EQ_GAIN_DB = 3.0

    def initialize(feedback:, reference_notes:, analysis:, target_profile:, client: nil, model: nil)
      @feedback = feedback.to_s
      @reference_notes = reference_notes.to_s
      @analysis = (analysis || {}).deep_stringify_keys
      @target_profile = target_profile.to_s.presence || "demo_balanced"
      @client = client
      @model = model.presence || ENV.fetch("OPENAI_MASTERING_FEEDBACK_MODEL", DEFAULT_MODEL)
    end

    def call
      return empty_result if normalized_feedback.blank?
      return deterministic_result unless ai_enabled?

      normalize_result(request_ai_parameters, source: "ai_tool")
    rescue StandardError => e
      Rails.logger.warn("Mastering::FeedbackParameterizer fallback error=#{e.class}: #{e.message}")
      deterministic_result
    end

    private

    attr_reader :feedback, :reference_notes, :analysis, :target_profile, :model

    def request_ai_parameters
      response = openai_client.chat(
        parameters: {
          model: model,
          temperature: 0.1,
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt }
          ],
          tools: [parameter_tool],
          tool_choice: {
            type: "function",
            function: { name: FUNCTION_NAME }
          }
        }
      )

      tool_call = Array(response.dig("choices", 0, "message", "tool_calls")).find do |call|
        call.dig("function", "name") == FUNCTION_NAME
      end

      raise Error, "OpenAI did not return mastering feedback parameters" if tool_call.blank?

      JSON.parse(tool_call.dig("function", "arguments").to_s)
    rescue JSON::ParserError
      raise Error, "OpenAI returned invalid JSON for mastering feedback parameters"
    end

    def deterministic_result
      bands = []
      warnings = []

      if low_cut_requested?
        bands << {
          filter: "low_shelf",
          frequency_hz: 90,
          gain_db: -0.8,
          q: 0.7,
          reason_es: "Recorte leve de graves/subgrave pedido en el feedback."
        }
      end

      if harshness_requested?
        bands << {
          filter: "bell",
          frequency_hz: 3600,
          gain_db: -0.8,
          q: 1.0,
          reason_es: "Suavizar aspereza o presencia agresiva sin apagar el mix."
        }
      end

      if high_cut_requested?
        gain = extreme_request? ? -2.5 : -1.2
        frequency = extreme_request? ? 8500 : 10_000
        bands << {
          filter: "high_shelf",
          frequency_hz: frequency,
          gain_db: gain,
          q: 0.7,
          reason_es: "Recortar agudos de forma audible pero segura."
        }
        warnings << "La peticion extrema sobre agudos se limito a un recorte seguro para no destruir el balance del mix." if extreme_request?
      elsif high_boost_requested?
        bands << {
          filter: "high_shelf",
          frequency_hz: 11_000,
          gain_db: 0.5,
          q: 0.7,
          reason_es: "Abrir un poco el extremo alto sin volverlo filoso."
        }
      end

      {
        source: "rules",
        summary_es: summary_for_bands(bands),
        eq_bands: normalize_bands(bands),
        lowpass_filter: deterministic_lowpass_filter,
        saturation: deterministic_saturation,
        compression: disabled_compression,
        warnings_es: warnings
      }
    end

    def normalize_result(result, source:)
      lowpass_filter = normalize_lowpass_filter(result["lowpass_filter"])
      lowpass_filter = deterministic_lowpass_filter if high_cut_requested? && extreme_request? && !lowpass_filter[:enabled]

      {
        source: source,
        summary_es: result["summary_es"].to_s.strip.presence || "Feedback interpretado como ajustes conservadores de mastering.",
        eq_bands: normalize_bands(result["eq_bands"]),
        lowpass_filter: lowpass_filter,
        saturation: normalize_saturation(result["saturation"]),
        compression: normalize_compression(result["compression"]),
        warnings_es: normalize_string_array(result["warnings_es"], limit: 4)
      }
    end

    def normalize_bands(bands)
      Array(bands).filter_map do |band|
        filter = band[:filter] || band["filter"]
        next unless %w[low_shelf bell high_shelf].include?(filter)

        {
          filter: filter,
          frequency_hz: clamp(number(band[:frequency_hz] || band["frequency_hz"], 1000), 20, 18_000).round,
          gain_db: clamp(number(band[:gain_db] || band["gain_db"], 0), -MAX_EQ_GAIN_DB, MAX_EQ_GAIN_DB).round(2),
          q: clamp(number(band[:q] || band["q"], 0.7), 0.2, 3.0).round(2),
          reason_es: (band[:reason_es] || band["reason_es"]).to_s.strip.presence || "Ajuste derivado del feedback."
        }
      end.first(4)
    end

    def normalize_lowpass_filter(value)
      value = (value || {}).with_indifferent_access
      enabled = ActiveModel::Type::Boolean.new.cast(value[:enabled])

      {
        enabled: enabled,
        frequency_hz: enabled ? clamp(number(value[:frequency_hz], 12_000), 8_000, 18_000).round : 18_000,
        slope_db_per_oct: enabled ? normalize_lowpass_slope(value[:slope_db_per_oct]) : 6,
        reason_es: value[:reason_es].to_s.strip.presence || "Filtro low-pass controlado segun feedback extremo."
      }
    end

    def normalize_saturation(value)
      value = (value || {}).with_indifferent_access
      enabled = ActiveModel::Type::Boolean.new.cast(value[:enabled])

      {
        enabled: enabled,
        drive_db: enabled ? clamp(number(value[:drive_db], 0.4), 0.0, 1.0).round(2) : 0,
        mix_percent: enabled ? clamp(number(value[:mix_percent], 10), 0, 20).round : 0,
        reason_es: value[:reason_es].to_s.strip.presence || "Saturacion sutil segun feedback."
      }
    end

    def normalize_compression(value)
      value = (value || {}).with_indifferent_access
      enabled = ActiveModel::Type::Boolean.new.cast(value[:enabled])

      {
        enabled: enabled,
        ratio: enabled ? clamp(number(value[:ratio], 1.3), 1.1, 1.6).round(2) : 1.3,
        mix_percent: enabled ? clamp(number(value[:mix_percent], 30), 0, 45).round : 0,
        reason_es: value[:reason_es].to_s.strip.presence || "Compresion paralela leve segun feedback."
      }
    end

    def deterministic_lowpass_filter
      enabled = high_cut_requested? && extreme_request?

      {
        enabled: enabled,
        frequency_hz: enabled ? 12_000 : 18_000,
        slope_db_per_oct: enabled ? 12 : 6,
        reason_es: enabled ? "Low-pass suave para que el pedido extremo de cortar agudos sea perceptible sin apagar completamente el master." : "Sin low-pass adicional."
      }
    end

    def deterministic_saturation
      enabled = saturation_requested?

      {
        enabled: enabled,
        drive_db: enabled ? 0.4 : 0,
        mix_percent: enabled ? 12 : 0,
        reason_es: enabled ? "Agregar densidad sutil pedida en el feedback." : "Sin saturacion solicitada."
      }
    end

    def disabled_compression
      {
        enabled: false,
        ratio: 1.3,
        mix_percent: 0,
        reason_es: "Sin compresion adicional solicitada."
      }
    end

    def empty_result
      {
        source: "none",
        summary_es: "Sin feedback de mastering para parametrizar.",
        eq_bands: [],
        lowpass_filter: deterministic_lowpass_filter,
        saturation: deterministic_saturation,
        compression: disabled_compression,
        warnings_es: []
      }
    end

    def ai_enabled?
      return true if @client.present?
      return false if Rails.env.test?
      return false if ENV["OPENAI_API_KEY"].blank?

      ActiveModel::Type::Boolean.new.cast(ENV.fetch("OPENAI_MASTERING_FEEDBACK_AI", "true"))
    end

    def openai_client
      @client ||= OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"], log_errors: true)
    end

    def system_prompt
      <<~PROMPT
        You are Rauversion's mastering feedback parameterizer for independent electronic music.
        Convert artist feedback into safe DSP parameters only.
        Do not invent audio measurements; use the provided measurements as constraints.
        Preserve the mix, avoid destructive mastering, and cap EQ moves to +/-3 dB.
        If the user asks for an extreme high-frequency cut like "maximum", use a safe high shelf plus an optional low-pass between 10 kHz and 14 kHz, then add a Spanish warning.
        Return the result only by calling #{FUNCTION_NAME}.
      PROMPT
    end

    def user_prompt
      <<~PROMPT
        Target profile: #{target_profile}
        Artist feedback: #{feedback.presence || "none"}
        Reference notes: #{reference_notes.presence || "none"}
        Measured audio stats: #{analysis.to_json}

        Parametrize only broad mastering moves. Prefer high_shelf/low_shelf/bell EQ.
        Use lowpass_filter only when the artist explicitly asks to cut highs strongly or maximally.
      PROMPT
    end

    def parameter_tool
      {
        type: "function",
        function: {
          name: FUNCTION_NAME,
          description: "Submit safe mastering parameters interpreted from artist feedback.",
          parameters: {
            type: "object",
            required: %w[summary_es eq_bands lowpass_filter saturation compression warnings_es],
            additionalProperties: false,
            properties: {
              summary_es: { type: "string" },
              eq_bands: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "object",
                  required: %w[filter frequency_hz gain_db q reason_es],
                  additionalProperties: false,
                  properties: {
                    filter: { type: "string", enum: %w[low_shelf bell high_shelf] },
                    frequency_hz: { type: "number", minimum: 20, maximum: 18_000 },
                    gain_db: { type: "number", minimum: -3, maximum: 3 },
                    q: { type: "number", minimum: 0.2, maximum: 3.0 },
                    reason_es: { type: "string" }
                  }
                }
              },
              lowpass_filter: {
                type: "object",
                required: %w[enabled frequency_hz slope_db_per_oct reason_es],
                additionalProperties: false,
                properties: {
                  enabled: { type: "boolean" },
                  frequency_hz: { type: "number", minimum: 8_000, maximum: 18_000 },
                  slope_db_per_oct: { type: "number", enum: [6, 12] },
                  reason_es: { type: "string" }
                }
              },
              saturation: {
                type: "object",
                required: %w[enabled drive_db mix_percent reason_es],
                additionalProperties: false,
                properties: {
                  enabled: { type: "boolean" },
                  drive_db: { type: "number", minimum: 0, maximum: 1 },
                  mix_percent: { type: "number", minimum: 0, maximum: 20 },
                  reason_es: { type: "string" }
                }
              },
              compression: {
                type: "object",
                required: %w[enabled ratio mix_percent reason_es],
                additionalProperties: false,
                properties: {
                  enabled: { type: "boolean" },
                  ratio: { type: "number", minimum: 1.1, maximum: 1.6 },
                  mix_percent: { type: "number", minimum: 0, maximum: 45 },
                  reason_es: { type: "string" }
                }
              },
              warnings_es: {
                type: "array",
                maxItems: 4,
                items: { type: "string" }
              }
            }
          }
        }
      }
    end

    def summary_for_bands(bands)
      return "Feedback recibido, pero no requiere cambios tonales claros." if bands.blank?

      "Feedback convertido en #{bands.size} ajuste(s) de mastering con limites seguros."
    end

    def low_cut_requested?
      normalized_feedback.match?(/grave|bajo|sub|boomy|retumba|turbio|muddy/)
    end

    def harshness_requested?
      normalized_feedback.match?(/aspero|áspero|agresiv|duro|chillon|chillón|sibil|filoso/)
    end

    def high_cut_requested?
      normalized_feedback.match?(/agudo|agudos|alto|altos|treble|brillo|brillante/) &&
        normalized_feedback.match?(/corta|cortar|recorta|recortar|quita|quitar|saca|sacar|menos|baja|bajar|reduce|reducir|oscuro|oscurece/)
    end

    def high_boost_requested?
      normalized_feedback.match?(/opaco|apagado|aire|abierto|abrir|brillo|brillante/) && !high_cut_requested? && !harshness_requested?
    end

    def saturation_requested?
      normalized_feedback.match?(/calid|cálid|dens|color|analog|satur/)
    end

    def extreme_request?
      normalized_feedback.match?(/maximo|máximo|full|mucho|todo|total|extremo|agresivo/)
    end

    def normalized_feedback
      @normalized_feedback ||= [feedback, reference_notes].join(" ").downcase
    end

    def normalize_string_array(values, limit:)
      Array(values).map { |value| value.to_s.strip }.select(&:present?).first(limit)
    end

    def clamp(value, min, max)
      [[value, min].max, max].min
    end

    def normalize_lowpass_slope(value)
      number(value, 12) >= 12 ? 12 : 6
    end

    def number(value, fallback = 0.0)
      return fallback if value.blank?

      Float(value)
    rescue ArgumentError, TypeError
      fallback
    end
  end
end
