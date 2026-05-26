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
        message: "Pre-master iniciado para #{track.title} con perfil #{track_master.target_profile}."
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
          message: "Pre-master listo para reproducir y descargar."
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
      "#{track.slug.presence || "track-#{track.id}"}-#{track_master.target_profile}-premaster.wav"
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

    def value_or_unknown(value)
      value.nil? ? "n/d" : value
    end
  end
end
