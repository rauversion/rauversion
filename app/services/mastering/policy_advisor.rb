require "json"
require "openai"

module Mastering
  class PolicyAdvisor
    FUNCTION_NAME = "submit_mastering_policy".freeze
    DEFAULT_MODEL = "gpt-4o-mini".freeze

    def initialize(profile:, analysis:, feedback:, reference_notes:, client: nil, model: nil)
      @profile = profile
      @analysis = (analysis || {}).deep_stringify_keys
      @feedback = feedback.to_s
      @reference_notes = reference_notes.to_s
      @client = client
      @model = model.presence || ENV.fetch("OPENAI_MASTERING_POLICY_MODEL", DEFAULT_MODEL)
    end

    def call
      return default_policy unless ai_enabled?

      normalize_policy(request_policy, source: "ai_tool")
    rescue StandardError => e
      Rails.logger.warn("Mastering::PolicyAdvisor fallback error=#{e.class}: #{e.message}")
      default_policy
    end

    private

    attr_reader :profile, :analysis, :feedback, :reference_notes, :model

    def request_policy
      response = openai_client.chat(
        parameters: {
          model: model,
          temperature: 0.1,
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt }
          ],
          tools: [policy_tool],
          tool_choice: {
            type: "function",
            function: { name: FUNCTION_NAME }
          }
        }
      )

      tool_call = Array(response.dig("choices", 0, "message", "tool_calls")).find do |call|
        call.dig("function", "name") == FUNCTION_NAME
      end
      raise "OpenAI did not return mastering policy" if tool_call.blank?

      JSON.parse(tool_call.dig("function", "arguments").to_s)
    end

    def default_policy
      {
        source: "profile",
        summary_es: "Politica base del perfil #{profile.label_es}.",
        limiter_max_gain_reduction_db: profile.limiter_gain_reduction_db(already_mastered: already_mastered?),
        loudness_correction_limit_db: profile.loudness_correction_limit_db,
        max_loudness_correction_passes: profile.max_loudness_correction_passes,
        minimum_crest_factor_db: profile.minimum_crest_factor_db,
        max_positive_gain_db: profile.max_positive_gain_db,
        loud_source_gain_cap_db: profile.loud_source_gain_cap_db,
        true_peak_safety_margin_db: profile.true_peak_safety_margin_db,
        warnings_es: []
      }
    end

    def normalize_policy(policy, source:)
      {
        source: source,
        summary_es: policy["summary_es"].to_s.strip.presence || default_policy[:summary_es],
        limiter_max_gain_reduction_db: clamp_number(policy["limiter_max_gain_reduction_db"], 0.0, profile.limiter_max_gain_reduction_db),
        loudness_correction_limit_db: clamp_number(policy["loudness_correction_limit_db"], 0.0, profile.loudness_correction_limit_db),
        max_loudness_correction_passes: clamp_number(policy["max_loudness_correction_passes"], 0, profile.max_loudness_correction_passes).round,
        minimum_crest_factor_db: normalize_minimum_crest(policy["minimum_crest_factor_db"]),
        max_positive_gain_db: clamp_number(policy["max_positive_gain_db"], 0.0, profile.max_positive_gain_db),
        loud_source_gain_cap_db: clamp_number(policy["loud_source_gain_cap_db"], 0.0, profile.loud_source_gain_cap_db),
        true_peak_safety_margin_db: clamp_number(policy["true_peak_safety_margin_db"], 0.3, [profile.true_peak_safety_margin_db, 0.8].max),
        warnings_es: normalize_string_array(policy["warnings_es"], limit: 4)
      }
    end

    def normalize_minimum_crest(value)
      return nil if profile.minimum_crest_factor_db.blank?

      clamp_number(value, profile.minimum_crest_factor_db, profile.minimum_crest_factor_db + 2.0)
    end

    def ai_enabled?
      return true if @client.present?
      return false if Rails.env.test?
      return false if ENV["OPENAI_API_KEY"].blank?

      ActiveModel::Type::Boolean.new.cast(ENV.fetch("OPENAI_MASTERING_POLICY_AI", "true"))
    end

    def openai_client
      @client ||= OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"], log_errors: true)
    end

    def system_prompt
      <<~PROMPT
        You are Rauversion's mastering policy advisor.
        Choose conservative guardrails for a mastering render, not raw DSP.
        You must stay inside the numeric limits provided by the target profile.
        Preserve transients and true peak safety over loudness.
        If a club master would pump, raise minimum_crest_factor_db rather than pushing loudness.
        Return only by calling #{FUNCTION_NAME}.
      PROMPT
    end

    def user_prompt
      <<~PROMPT
        Target profile: #{profile.to_h.to_json}
        Audio analysis before mastering: #{analysis.to_json}
        Artist feedback: #{feedback.presence || "none"}
        Reference notes: #{reference_notes.presence || "none"}

        Return policy values that keep the render safe and musical.
      PROMPT
    end

    def policy_tool
      {
        type: "function",
        function: {
          name: FUNCTION_NAME,
          description: "Submit mastering safety and loudness policy values.",
          parameters: {
            type: "object",
            required: %w[
              summary_es
              limiter_max_gain_reduction_db
              loudness_correction_limit_db
              max_loudness_correction_passes
              minimum_crest_factor_db
              max_positive_gain_db
              loud_source_gain_cap_db
              true_peak_safety_margin_db
              warnings_es
            ],
            additionalProperties: false,
            properties: {
              summary_es: { type: "string" },
              limiter_max_gain_reduction_db: { type: "number" },
              loudness_correction_limit_db: { type: "number" },
              max_loudness_correction_passes: { type: "number" },
              minimum_crest_factor_db: { type: "number" },
              max_positive_gain_db: { type: "number" },
              loud_source_gain_cap_db: { type: "number" },
              true_peak_safety_margin_db: { type: "number" },
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

    def already_mastered?
      integrated_lufs = number(analysis["integrated_lufs"])
      true_peak = number(analysis["true_peak_dbfs"])

      (integrated_lufs.present? && integrated_lufs >= -10.0) ||
        (true_peak.present? && true_peak > -0.7)
    end

    def clamp_number(value, min, max)
      [[number(value) || min, min].max, max].min
    end

    def normalize_string_array(values, limit:)
      Array(values).map { |value| value.to_s.strip }.select(&:present?).first(limit)
    end

    def number(value)
      return if value.blank?

      Float(value)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
