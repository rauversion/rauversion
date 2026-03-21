namespace :tracks do
  desc "Analyze published tracks and persist inferred metadata"
  task analyze_published: :environment do
    dry_run = ActiveModel::Type::Boolean.new.cast(ENV["DRY_RUN"])
    skip_analyzed = ActiveModel::Type::Boolean.new.cast(ENV["SKIP_ANALYZED"])
    limit = ENV["LIMIT"].to_i
    start_seconds = ENV["START_SECONDS"]
    duration_seconds = ENV["DURATION_SECONDS"]
    track_id = ENV["TRACK_ID"].presence

    relation = Track.published
    relation = relation.where(id: track_id) if track_id.present?
    relation = relation.where(analyzed_at: nil) if skip_analyzed
    relation = relation.limit(limit) if limit.positive?

    scanned_tracks = 0
    analyzed_tracks = 0
    failed_tracks = 0
    skipped_tracks = 0
    analyzable_audio_attached = lambda do |track|
      mp3_audio = track.mp3_audio if track.respond_to?(:mp3_audio)
      next true if mp3_audio&.attached?

      audio = track.analyzable_audio_media if track.respond_to?(:analyzable_audio_media)
      audio&.attached? || false
    end

    relation.find_each do |track|
      scanned_tracks += 1

      unless analyzable_audio_attached.call(track)
        skipped_tracks += 1
        puts "[SKIP] track_id=#{track.id} reason=no_analyzable_audio"
        next
      end

      if dry_run
        puts "[DRY_RUN] track_id=#{track.id} title=#{track.title.inspect}"
        next
      end

      TrackAudioAnalysisService.new(
        track: track,
        start_seconds: start_seconds,
        duration_seconds: duration_seconds,
        persist: true
      ).call

      analyzed_tracks += 1
      puts "[OK] track_id=#{track.id} title=#{track.title.inspect}"
    rescue TrackAudioAnalysisService::Error => e
      failed_tracks += 1
      puts "[ERROR] track_id=#{track.id} error=#{e.message}"
    rescue StandardError => e
      failed_tracks += 1
      puts "[ERROR] track_id=#{track.id} error=#{e.class}: #{e.message}"
    end

    mode = dry_run ? "DRY_RUN" : "APPLY"
    puts "[#{mode}] scanned_tracks=#{scanned_tracks} analyzed_tracks=#{analyzed_tracks} failed_tracks=#{failed_tracks} skipped_tracks=#{skipped_tracks}"
  end
end
