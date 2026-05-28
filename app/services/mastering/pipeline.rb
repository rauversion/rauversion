require "fileutils"

module Mastering
  class Pipeline
    class Error < StandardError; end

    def initialize(track_master:)
      @track_master = track_master
      @track = track_master.track
    end

    def call
      track_master.mark_running!
      event!(
        event: "started",
        step: "queue",
        progress: 5,
        message: "Master iniciado para #{track.title} con perfil #{track_master.target_profile}."
      )

      attachment = source_attachment
      raise Error, "track has no analyzable audio" unless attachment&.attached?
      event!(
        event: "source_ready",
        step: "source",
        progress: 10,
        message: "Audio fuente localizado: #{attachment.filename}."
      )

      output_path = nil

      attachment.open do |source_file|
        event!(
          event: "analysis_before_started",
          step: "analysis_before",
          progress: 20,
          message: "Analizando loudness, peaks, rango dinamico y balance espectral del archivo original."
        )
        analysis_before = AudioAnalyzer.new(input_path: source_file.path).call
        event!(
          event: "analysis_before_finished",
          step: "analysis_before",
          progress: 35,
          message: "Analisis inicial completado: #{analysis_summary(analysis_before)}.",
          payload: { analysis_before: analysis_before }
        )

        event!(
          event: "recipe_started",
          step: "recipe",
          progress: 40,
          message: "Generando receta de mastering conservadora segun feedback y perfil objetivo."
        )
        recipe = RecipeGenerator.new(
          track: track,
          analysis: analysis_before,
          target_profile: track_master.target_profile,
          feedback: track_master.feedback,
          reference_notes: track_master.reference_notes
        ).call
        event!(
          event: "recipe_finished",
          step: "recipe",
          progress: 50,
          message: recipe.dig(:diagnosis, :summary_es) || recipe.dig("diagnosis", "summary_es") || "Receta generada."
        )

        event!(
          event: "render_started",
          step: "render",
          progress: 60,
          message: "Aplicando cadena DSP y renderizando WAV 24-bit."
        )
        output_path = AudioProcessor.new(
          input_path: source_file.path,
          recipe: recipe,
          analysis_before: analysis_before
        ).call
        event!(
          event: "render_finished",
          step: "render",
          progress: 75,
          message: "Render WAV completado; verificando resultado."
        )

        event!(
          event: "analysis_after_started",
          step: "analysis_after",
          progress: 82,
          message: "Reanalizando master para confirmar LUFS, true peak y clipping."
        )
        analysis_after = AudioAnalyzer.new(input_path: output_path).call
        event!(
          event: "analysis_after_finished",
          step: "analysis_after",
          progress: 90,
          message: "Analisis final completado: #{analysis_summary(analysis_after)}.",
          payload: { analysis_after: analysis_after }
        )

        correction_pass = 0
        while correction_pass < max_loudness_correction_passes && (correction_db = loudness_correction_db(recipe, analysis_after)).positive?
          correction_pass += 1
          loudness_offset_db = current_loudness_offset_db(recipe) + correction_db

          event!(
            event: "loudness_correction_started",
            step: "loudness_correction",
            progress: 92,
            message: "El master quedo bajo el target; aplicando pasada #{correction_pass} de correccion con offset acumulado de +#{loudness_offset_db.round(2)} dB."
          )

          corrected_recipe = recipe_with_loudness_offset(recipe, loudness_offset_db, correction_pass)
          corrected_output_path = AudioProcessor.new(
            input_path: source_file.path,
            recipe: corrected_recipe,
            analysis_before: analysis_before
          ).call

          corrected_analysis_after = AudioAnalyzer.new(input_path: corrected_output_path).call

          if unsafe_analysis?(corrected_recipe, corrected_analysis_after)
            cleanup_output(corrected_output_path)
            event!(
              event: "loudness_correction_stopped",
              step: "loudness_correction",
              progress: 94,
              message: "Correccion detenida para preservar true peak: #{analysis_summary(corrected_analysis_after)}.",
              payload: { analysis_after: analysis_after }
            )
            break
          end

          cleanup_output(output_path)
          output_path = corrected_output_path
          recipe = corrected_recipe
          analysis_after = corrected_analysis_after

          event!(
            event: "loudness_correction_finished",
            step: "loudness_correction",
            progress: 94,
            message: "Pasada #{correction_pass} completada: #{analysis_summary(analysis_after)}.",
            payload: { analysis_after: analysis_after }
          )
        end

        event!(
          event: "attach_started",
          step: "attach",
          progress: 95,
          message: "Adjuntando archivo master al track."
        )
        attach_output!(output_path)

        track_master.mark_completed!(
          analysis_before: analysis_before,
          recipe: recipe,
          analysis_after: analysis_after
        )
        event!(
          event: "completed",
          step: "completed",
          progress: 100,
          message: "Master listo para reproducir y descargar."
        )
      end

      track_master
    ensure
      cleanup_output(output_path)
    end

    private

    attr_reader :track_master, :track

    def source_attachment
      track.analyzable_audio_media || track.playback_media
    end

    def attach_output!(path)
      File.open(path, "rb") do |file|
        track_master.audio.attach(
          io: file,
          filename: output_filename,
          content_type: "audio/wav"
        )
      end
    end

    def output_filename
      suffix = track_master.target_profile == "vinyl_premaster" ? "premaster" : "master"
      "#{track.slug.presence || "track-#{track.id}"}-#{track_master.target_profile}-#{suffix}.wav"
    end

    def cleanup_output(path)
      return if path.blank?

      dir = File.dirname(path)
      FileUtils.remove_entry(dir) if dir.start_with?(Dir.tmpdir) && Dir.exist?(dir)
    end

    def event!(event:, step:, message:, progress: nil, level: "info", payload: {})
      Mastering::Broadcaster.broadcast(
        track_master,
        event: event,
        step: step,
        message: message,
        progress: progress,
        level: level,
        payload: payload
      )
    end

    def analysis_summary(analysis)
      lufs = analysis_value(analysis, :integrated_lufs)
      true_peak = analysis_value(analysis, :true_peak_dbfs)
      clipping = analysis_value(analysis, :clipping_detected)

      "LUFS #{value_or_unknown(lufs)}, true peak #{value_or_unknown(true_peak)} dB, clipping #{value_or_unknown(clipping)}"
    end

    def analysis_value(analysis, key)
      return analysis[key] if analysis.key?(key)

      analysis[key.to_s]
    end

    def loudness_correction_db(recipe, analysis_after)
      return 0.0 if unsafe_analysis?(recipe, analysis_after)

      profile = recipe_value(recipe, :target, :profile).to_s
      return 0.0 if profile == "vinyl_premaster"

      target_lufs = number(recipe_value(recipe, :target, :target_lufs))
      current_lufs = number(analysis_value(analysis_after, :integrated_lufs))
      true_peak = number(analysis_value(analysis_after, :true_peak_dbfs))
      ceiling = number(recipe_value(recipe, :target, :true_peak_ceiling_db))
      return 0.0 if target_lufs.blank? || current_lufs.blank?
      return 0.0 if true_peak.present? && ceiling.present? && true_peak > ceiling

      correction = target_lufs - current_lufs
      return 0.0 if correction <= 0.3

      [correction, loudness_correction_limit_db(profile)].min.round(2)
    end

    def loudness_correction_limit_db(profile)
      case profile
      when "club_loud" then 4.0
      when "demo_balanced" then 2.0
      when "streaming_clean" then 1.5
      else 1.0
      end
    end

    def recipe_with_loudness_offset(recipe, loudness_offset_db, correction_pass)
      recipe.deep_dup.tap do |corrected_recipe|
        corrected_recipe[:render_adjustments] = {
          loudness_offset_db: loudness_offset_db.round(2),
          correction_passes: correction_pass,
          reason_es: "Correccion iterativa para acercar el master al LUFS objetivo sin perder el ceiling de true peak."
        }
      end
    end

    def current_loudness_offset_db(recipe)
      number(recipe_value(recipe, :render_adjustments, :loudness_offset_db)) || 0.0
    end

    def unsafe_analysis?(recipe, analysis)
      return true if ActiveModel::Type::Boolean.new.cast(analysis_value(analysis, :clipping_detected))

      true_peak = number(analysis_value(analysis, :true_peak_dbfs))
      ceiling = number(recipe_value(recipe, :target, :true_peak_ceiling_db))
      true_peak.present? && ceiling.present? && true_peak > ceiling
    end

    def max_loudness_correction_passes
      3
    end

    def recipe_value(recipe, *keys)
      keys.reduce(recipe) do |memo, key|
        break if memo.blank?

        memo[key] || memo[key.to_s]
      end
    end

    def value_or_unknown(value)
      value.nil? ? "n/d" : value
    end

    def number(value)
      Float(value)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
