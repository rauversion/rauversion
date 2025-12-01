module PlaylistGen
  module Api
    module V1
      class TracksController < ApplicationController
        # Allowed base paths for streaming - configurable via ENV
        ALLOWED_AUDIO_PATHS = ENV.fetch("PLAYLIST_GEN_ALLOWED_PATHS", "/Volumes,/Music,/home").split(",").map(&:strip).freeze
        
        # Allowed audio MIME types
        AUDIO_MIME_TYPES = {
          ".mp3" => "audio/mpeg",
          ".flac" => "audio/flac",
          ".wav" => "audio/wav",
          ".m4a" => "audio/mp4",
          ".aac" => "audio/aac",
          ".ogg" => "audio/ogg",
          ".opus" => "audio/opus",
          ".aiff" => "audio/aiff",
          ".aif" => "audio/aiff"
        }.freeze

        # GET /api/v1/tracks/:id/stream
        def stream
          track = Track.find(params[:id])
          
          unless track.file_path.present?
            return render json: { error: "No file path for this track" }, status: :not_found
          end

          # Security: Validate the path is allowed
          unless allowed_path?(track.file_path)
            Rails.logger.warn "Blocked attempt to access unauthorized path: #{track.file_path}"
            return render json: { error: "Access denied" }, status: :forbidden
          end

          # Resolve the real path to prevent directory traversal attacks
          begin
            real_path = File.realpath(track.file_path)
          rescue Errno::ENOENT
            return render json: { error: "File not found" }, status: :not_found
          end

          # Re-check the resolved path is still within allowed directories
          unless allowed_path?(real_path)
            Rails.logger.warn "Blocked directory traversal attempt: #{track.file_path} -> #{real_path}"
            return render json: { error: "Access denied" }, status: :forbidden
          end

          unless File.exist?(real_path)
            return render json: { error: "File not found" }, status: :not_found
          end

          # Determine content type from file extension
          ext = File.extname(real_path).downcase
          content_type = AUDIO_MIME_TYPES[ext]
          
          unless content_type
            return render json: { error: "Unsupported audio format" }, status: :unsupported_media_type
          end

          file_size = File.size(real_path)
          
          # Handle range requests for seeking support
          if request.headers["Range"]
            range_header = request.headers["Range"]
            ranges = range_header.gsub("bytes=", "").split("-")
            start_byte = ranges[0].to_i
            end_byte = ranges[1].present? ? ranges[1].to_i : file_size - 1
            
            # Validate range
            end_byte = [end_byte, file_size - 1].min
            length = end_byte - start_byte + 1

            response.headers["Content-Range"] = "bytes #{start_byte}-#{end_byte}/#{file_size}"
            response.headers["Accept-Ranges"] = "bytes"
            response.headers["Content-Length"] = length.to_s
            response.headers["Content-Type"] = content_type
            response.status = 206

            send_file_with_range(real_path, start_byte, length, content_type)
          else
            # Full file streaming
            response.headers["Accept-Ranges"] = "bytes"
            response.headers["Content-Length"] = file_size.to_s
            send_file real_path, type: content_type, disposition: "inline"
          end
        end

        # GET /api/v1/tracks/:id
        def show
          track = Track.find(params[:id])
          render json: { track: track_json(track) }
        end

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
            source: track.source,
            stream_url: track.file_path.present? ? stream_track_url(track) : nil
          }
        end

        def stream_track_url(track)
          "/playlist_gen/api/v1/tracks/#{track.id}/stream"
        end

        # Security: Check if path starts with one of the allowed base paths
        def allowed_path?(path)
          return false if path.blank?
          
          # Normalize the path first
          normalized = File.expand_path(path)
          
          ALLOWED_AUDIO_PATHS.any? do |allowed_base|
            normalized.start_with?(allowed_base)
          end
        end

        # Stream file with range support for seeking
        def send_file_with_range(path, start_byte, length, content_type)
          File.open(path, "rb") do |file|
            file.seek(start_byte)
            self.response_body = Enumerator.new do |yielder|
              remaining = length
              while remaining > 0
                chunk_size = [8192, remaining].min
                data = file.read(chunk_size)
                break if data.nil?
                yielder << data
                remaining -= data.bytesize
              end
            end
          end
        end
      end
    end
  end
end
