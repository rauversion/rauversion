module PlaylistGen
  class SetGenerator
    attr_reader :duration_minutes, :bpm_min, :bpm_max, :genres, :energy_curve, :name

    ENERGY_CURVES = {
      linear_up: { start: 3, finish: 9, type: :linear },
      constant: { start: 6, finish: 6, type: :constant },
      waves: { start: 5, finish: 8, type: :waves }
    }.freeze

    def self.call(**args)
      new(**args).call
    end

    def initialize(duration_minutes:, bpm_min:, bpm_max:, genres: [], energy_curve: :linear_up, name: "Auto Set")
      @duration_minutes = duration_minutes
      @bpm_min = bpm_min.to_f
      @bpm_max = bpm_max.to_f
      @genres = Array(genres).map(&:to_s).reject(&:blank?)
      @energy_curve = energy_curve.to_sym
      @name = name
    end

    def call
      pool = build_track_pool
      
      if pool.empty?
        raise GenerationError, "No tracks found matching criteria (BPM: #{bpm_min}-#{bpm_max})"
      end

      selected_tracks = generate_set(pool)

      if selected_tracks.empty?
        raise GenerationError, "Could not generate a set with the given criteria"
      end

      create_playlist(selected_tracks)
    end

    private

    def build_track_pool
      scope = PlaylistGen::Track.by_bpm_range(bpm_min, bpm_max)
      
      if genres.any?
        scope = scope.by_genres(genres)
      end

      scope.to_a
    end

    def generate_set(pool)
      target_duration = duration_minutes * 60
      accumulated_duration = 0
      selected = []
      used_ids = Set.new
      
      # Find initial track - closest to bpm_min with lowest energy
      initial_track = select_initial_track(pool)
      return [] unless initial_track

      selected << initial_track
      used_ids << initial_track.id
      accumulated_duration += initial_track.duration_seconds || 300

      current_track = initial_track
      position = 1

      while accumulated_duration < target_duration && used_ids.size < pool.size
        position += 1
        progress = accumulated_duration.to_f / target_duration
        desired_energy = calculate_desired_energy(progress)

        candidates = pool.reject { |t| used_ids.include?(t.id) }
        break if candidates.empty?

        next_track = select_best_candidate(current_track, candidates, desired_energy, selected)
        break unless next_track

        selected << next_track
        used_ids << next_track.id
        accumulated_duration += next_track.duration_seconds || 300
        current_track = next_track
      end

      selected
    end

    def select_initial_track(pool)
      pool
        .select { |t| t.bpm.present? }
        .min_by { |t| [(t.bpm - bpm_min).abs, t.energy || 5] }
    end

    def select_best_candidate(current, candidates, desired_energy, selected)
      last_artist = current.artist&.downcase

      scored_candidates = candidates.map do |candidate|
        score = calculate_candidate_score(current, candidate, desired_energy, last_artist)
        [candidate, score]
      end

      scored_candidates.max_by { |_, score| score }&.first
    end

    def calculate_candidate_score(current, candidate, desired_energy, last_artist)
      score = 100.0

      # BPM proximity (max 30 points, less BPM jump = better)
      if current.bpm && candidate.bpm
        bpm_diff = (current.bpm - candidate.bpm).abs
        bpm_score = [30 - (bpm_diff * 5), 0].max
        score += bpm_score
      end

      # Key compatibility (max 25 points)
      if current.key && candidate.key
        key_score = calculate_key_compatibility(current.key, candidate.key)
        score += key_score
      end

      # Energy curve match (max 20 points)
      if candidate.energy
        energy_diff = (candidate.energy - desired_energy).abs
        energy_score = [20 - (energy_diff * 3), 0].max
        score += energy_score
      end

      # Penalize consecutive same artist (-30 points)
      if candidate.artist&.downcase == last_artist
        score -= 30
      end

      score
    end

    def calculate_key_compatibility(key1, key2)
      # Simple Camelot wheel compatibility
      # Perfect match = 25, adjacent = 20, compatible = 15, else = 0
      return 25 if key1 == key2

      # Parse Camelot notation (e.g., "8A", "11B")
      num1, mode1 = parse_camelot_key(key1)
      num2, mode2 = parse_camelot_key(key2)

      return 5 unless num1 && num2

      # Same number, different mode (A/B)
      if num1 == num2 && mode1 != mode2
        return 20
      end

      # Adjacent on Camelot wheel (same mode, +/- 1)
      if mode1 == mode2
        diff = (num1 - num2).abs
        diff = 12 - diff if diff > 6 # Wrap around the wheel
        return 20 if diff == 1
        return 15 if diff == 2
      end

      5
    end

    def parse_camelot_key(key)
      return [nil, nil] unless key

      # Handle formats: "8A", "8B", "11A", etc.
      match = key.to_s.match(/^(\d+)([ABab])$/i)
      return [nil, nil] unless match

      num = match[1].to_i
      # Validate Camelot wheel range (1-12)
      return [nil, nil] unless num >= 1 && num <= 12

      [num, match[2].upcase]
    end

    def calculate_desired_energy(progress)
      curve_config = ENERGY_CURVES[energy_curve] || ENERGY_CURVES[:linear_up]
      start_energy = curve_config[:start]
      finish_energy = curve_config[:finish]

      case curve_config[:type]
      when :constant
        start_energy
      when :waves
        # Oscillating energy with overall upward trend
        base = start_energy + (finish_energy - start_energy) * progress
        wave = Math.sin(progress * Math::PI * 4) * 1.5
        (base + wave).clamp(1, 10)
      else # :linear
        start_energy + (finish_energy - start_energy) * progress
      end
    end

    def create_playlist(tracks)
      total_duration = tracks.sum { |t| t.duration_seconds || 300 }

      playlist = PlaylistGen::Playlist.create!(
        name: name,
        duration_seconds: total_duration,
        bpm_min: bpm_min,
        bpm_max: bpm_max,
        energy_curve: energy_curve.to_s,
        total_tracks: tracks.size,
        status: "generated",
        generated_at: Time.current
      )

      tracks.each_with_index do |track, index|
        PlaylistGen::PlaylistTrack.create!(
          playlist: playlist,
          track: track,
          position: index + 1
        )
      end

      playlist
    end

    class GenerationError < StandardError; end
  end
end
