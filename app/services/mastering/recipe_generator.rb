module Mastering
  class RecipeGenerator
    def initialize(track:, analysis:, target_profile:, feedback: nil, reference_notes: nil, feedback_parameterizer: nil)
      @track = track
      @analysis = (analysis || {}).deep_stringify_keys
      @target_profile = target_profile.presence || "demo_balanced"
      @feedback = feedback.to_s
      @reference_notes = reference_notes.to_s
      @profile = TargetProfiles.fetch(@target_profile)
      @feedback_parameterizer = feedback_parameterizer
    end

    def call
      {
        diagnosis: diagnosis,
        target: target,
        feedback_interpretation: feedback_interpretation,
        processing_chain: processing_chain,
        export: export_settings,
        artist_message_es: artist_message,
        warnings_es: warnings
      }
    end

    private

    attr_reader :track, :analysis, :target_profile, :feedback, :reference_notes, :profile, :feedback_parameterizer

    def diagnosis
      {
        summary_es: diagnosis_summary,
        risk_level: risk_level,
        already_mastered: already_mastered?,
        main_issues: main_issues
      }
    end

    def target
      {
        profile: normalized_target_profile,
        target_lufs: profile[:target_lufs],
        true_peak_ceiling_db: profile[:true_peak_ceiling_db]
      }
    end

    def processing_chain
      [
        highpass_filter,
        eq,
        lowpass_filter,
        bus_compressor,
        saturation,
        limiter
      ]
    end

    def highpass_filter
      frequency = normalized_target_profile == "vinyl_premaster" ? 30 : 25

      {
        type: "highpass_filter",
        enabled: true,
        frequency_hz: frequency,
        slope_db_per_oct: 12,
        reason_es: "Limpiar DC y energía subsonica sin adelgazar el bajo."
      }
    end

    def eq
      bands = eq_bands

      {
        type: "eq",
        enabled: bands.any?,
        bands: bands,
        reason_es: bands.any? ? "Ajustes amplios y conservadores guiados por el feedback del track." : "Sin datos espectrales problemáticos ni feedback que justifique ecualización."
      }
    end

    def lowpass_filter
      lowpass = feedback_interpretation[:lowpass_filter] || {}
      enabled = ActiveModel::Type::Boolean.new.cast(lowpass[:enabled])

      {
        type: "lowpass_filter",
        enabled: enabled,
        frequency_hz: enabled ? lowpass[:frequency_hz] : 18_000,
        slope_db_per_oct: enabled ? lowpass[:slope_db_per_oct] : 6,
        reason_es: enabled ? lowpass[:reason_es] : "Sin low-pass adicional."
      }
    end

    def bus_compressor
      enabled = !already_mastered? && crest_factor_db.present? && crest_factor_db > 13.0

      {
        type: "bus_compressor",
        enabled: enabled,
        threshold_db: -18,
        ratio: 1.4,
        attack_ms: 30,
        release_ms: 160,
        makeup_gain_db: 0,
        mix_percent: 40,
        reason_es: enabled ? "Control paralelo muy leve para estabilizar dinámica sin perder transientes." : "La dinámica medida no justifica compresión adicional."
      }
    end

    def saturation
      requested_saturation = feedback_interpretation.dig(:saturation, :enabled)
      enabled = requested_saturation && normalized_target_profile != "vinyl_premaster" && risk_level != "high"

      {
        type: "saturation",
        enabled: enabled,
        drive_db: enabled ? feedback_interpretation.dig(:saturation, :drive_db) : 0,
        mix_percent: enabled ? feedback_interpretation.dig(:saturation, :mix_percent) : 0,
        reason_es: enabled ? feedback_interpretation.dig(:saturation, :reason_es) : "No se aplica saturación para preservar el mix."
      }
    end

    def limiter
      enabled = normalized_target_profile != "vinyl_premaster"

      {
        type: "limiter",
        enabled: enabled,
        ceiling_db: profile[:true_peak_ceiling_db],
        target_lufs: profile[:target_lufs],
        max_gain_reduction_db: already_mastered? ? 1.0 : 2.0,
        reason_es: enabled ? "Controlar true peak como ultimo paso y evitar inter-sample clipping." : "Para premaster de vinilo se prioriza headroom y se evita hard limiting."
      }
    end

    def export_settings
      {
        format: "wav",
        bit_depth: 24,
        sample_rate_hz: analysis["sample_rate_hz"].presence || 44_100,
        dither: true
      }
    end

    def eq_bands
      feedback_interpretation.fetch(:eq_bands, []).map do |band|
        {
          filter: band[:filter],
          frequency_hz: band[:frequency_hz],
          gain_db: band[:gain_db],
          q: band[:q]
        }
      end
    end

    def diagnosis_summary
      if already_mastered?
        "El track ya viene con bastante nivel. La recomendacion es limpiar subgrave/DC, cuidar true peak y evitar empujarlo mas de lo necesario."
      elsif integrated_lufs.present?
        "El track conserva margen para un pre-master controlado. Conviene trabajar con movimientos amplios, poca compresion y limitacion final segura."
      else
        "No se pudo medir loudness completo; se recomienda una cadena conservadora con limpieza subsonica y control de peak."
      end
    end

    def artist_message
      "Prepararemos un pre-master #{Mastering::TargetProfiles.fetch(normalized_target_profile)[:label_es]} para #{track.title}, preservando el caracter del mix y priorizando margen de true peak seguro."
    end

    def warnings
      messages = []
      messages << "No se recomienda subir mas el loudness sin perder dinamica." if already_mastered?
      messages << "El true peak medido esta cerca de 0 dBFS; el limitador debe trabajar con margen." if true_peak_dbfs.present? && true_peak_dbfs > -1.0
      messages << "Para vinilo conviene preparar una version especifica con menos limitacion y mas headroom." unless normalized_target_profile == "vinyl_premaster"
      messages.concat(Array(feedback_interpretation[:warnings_es]))
      messages
    end

    def main_issues
      issues = []
      issues << "True peak cerca de 0 dBFS" if true_peak_dbfs.present? && true_peak_dbfs > -1.0
      issues << "Material ya muy fuerte para seguir aumentando loudness" if already_mastered?
      issues << "Clipping o peak extremadamente alto detectado" if analysis["clipping_detected"]
      issues << "Feedback del artista requiere ajustes sutiles" if feedback.present?
      issues << "Medicion de LUFS no disponible" if integrated_lufs.blank?
      issues.presence || ["No se detectan problemas tecnicos severos"]
    end

    def risk_level
      return "high" if analysis["clipping_detected"] || (true_peak_dbfs.present? && true_peak_dbfs >= -0.1)
      return "medium" if already_mastered? || (true_peak_dbfs.present? && true_peak_dbfs > profile[:true_peak_ceiling_db])

      "low"
    end

    def already_mastered?
      (integrated_lufs.present? && integrated_lufs >= -10.0) ||
        (true_peak_dbfs.present? && true_peak_dbfs > -0.7)
    end

    def normalized_target_profile
      return target_profile if TargetProfiles.all.key?(target_profile)

      "demo_balanced"
    end

    def feedback_interpretation
      @feedback_interpretation ||= begin
        parameterizer = feedback_parameterizer || FeedbackParameterizer.new(
          feedback: feedback,
          reference_notes: reference_notes,
          analysis: analysis,
          target_profile: normalized_target_profile
        )

        parameterizer.call.deep_symbolize_keys
      end
    end

    def integrated_lufs
      number(analysis["integrated_lufs"])
    end

    def true_peak_dbfs
      number(analysis["true_peak_dbfs"])
    end

    def crest_factor_db
      number(analysis["crest_factor_db"])
    end

    def number(value)
      Float(value)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
