module PlaylistGen
  module Api
    module V1
      class TracksController < ApplicationController
        # GET /api/v1/tracks
        def index
          base_scope = Track.all
          
          # Optional filters
          base_scope = base_scope.by_bpm_range(params[:bpm_min], params[:bpm_max]) if params[:bpm_min] && params[:bpm_max]
          base_scope = base_scope.by_genres(params[:genres].split(",")) if params[:genres].present?
          base_scope = base_scope.without_genre if params[:without_genre] == "true"
          base_scope = base_scope.with_genre if params[:with_genre] == "true"
          
          total_matching = base_scope.count
          tracks = base_scope.limit(params[:limit] || 100)

          render json: {
            tracks: tracks.map { |t| track_json(t) },
            returned_count: tracks.size,
            total_matching: total_matching,
            without_genre_count: Track.without_genre.count
          }
        end

        # POST /api/v1/tracks/:id/classify
        def classify
          track = Track.find(params[:id])
          result = track.classify_genre!

          render json: {
            track: track_json(track.reload),
            classification: result
          }
        end

        # POST /api/v1/tracks/classify_batch
        def classify_batch
          batch_size = (params[:batch_size] || 50).to_i
          batch_size = [batch_size, 100].min # Cap at 100

          if params[:async] == "true"
            GenreClassificationJob.perform_later(nil, batch_size: batch_size)
            render json: { 
              status: "queued",
              message: "Genre classification job queued for #{batch_size} tracks"
            }
          else
            results = GenreClassifier.classify_untagged(limit: batch_size)
            render json: {
              status: "completed",
              classified_count: results.size,
              results: results.map { |r| 
                { 
                  track_id: r[:track_id], 
                  genre: r[:result]["genre"],
                  confidence: r[:result]["confidence"]
                }
              }
            }
          end
        end

        # GET /api/v1/tracks/stats
        def stats
          render json: {
            total_tracks: Track.count,
            with_genre: Track.with_genre.count,
            without_genre: Track.without_genre.count,
            genre_distribution: Track.with_genre.group(:genre).count,
            bpm_range: {
              min: Track.minimum(:bpm),
              max: Track.maximum(:bpm),
              avg: Track.average(:bpm)&.round(1)
            }
          }
        end

        private

        def track_json(track)
          {
            id: track.id,
            title: track.title,
            artist: track.artist,
            bpm: track.bpm&.to_f,
            key: track.key,
            genre: track.genre,
            energy: track.energy,
            duration_seconds: track.duration_seconds,
            file_path: track.file_path,
            source: track.source
          }
        end
      end
    end
  end
end
