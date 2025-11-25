module PlaylistGen
  module Api
    module V1
      class PlaylistsController < ApplicationController
        def index
          playlists = Playlist.generated.recent

          render json: {
            playlists: playlists.map { |p| playlist_summary_json(p) }
          }
        end

        def show
          playlist = Playlist.find(params[:id])
          render json: { playlist: playlist_detail_json(playlist) }
        end

        def export_m3u
          playlist = Playlist.find(params[:id])
          m3u_content = generate_m3u(playlist)

          send_data m3u_content,
                    filename: "#{playlist.name.parameterize}-#{playlist.id}.m3u",
                    type: "audio/x-mpegurl",
                    disposition: "attachment"
        end

        private

        def playlist_summary_json(playlist)
          {
            id: playlist.id,
            name: playlist.name,
            total_tracks: playlist.total_tracks,
            duration_seconds: playlist.duration_seconds,
            duration_human: playlist.duration_human,
            bpm_min: playlist.bpm_min.to_f,
            bpm_max: playlist.bpm_max.to_f,
            energy_curve: playlist.energy_curve,
            generated_at: playlist.generated_at
          }
        end

        def playlist_detail_json(playlist)
          {
            id: playlist.id,
            name: playlist.name,
            duration_seconds: playlist.duration_seconds,
            duration_human: playlist.duration_human,
            bpm_min: playlist.bpm_min.to_f,
            bpm_max: playlist.bpm_max.to_f,
            energy_curve: playlist.energy_curve,
            total_tracks: playlist.total_tracks,
            status: playlist.status,
            generated_at: playlist.generated_at,
            tracks: playlist.playlist_tracks.includes(:track).map do |pt|
              track_json(pt)
            end
          }
        end

        def track_json(playlist_track)
          track = playlist_track.track
          {
            position: playlist_track.position,
            id: track.id,
            title: track.title,
            artist: track.artist,
            bpm: track.bpm.to_f,
            key: track.key,
            genre: track.genre,
            energy: track.energy,
            duration_seconds: track.duration_seconds,
            duration_human: playlist_track.duration_human
          }
        end

        def generate_m3u(playlist)
          lines = ["#EXTM3U"]

          playlist.playlist_tracks.includes(:track).each do |pt|
            track = pt.track
            duration = track.duration_seconds || 0
            artist = track.artist || "Unknown Artist"
            title = track.title || "Unknown Track"
            file_path = track.file_path || "unknown.mp3"

            lines << "#EXTINF:#{duration},#{artist} - #{title}"
            lines << file_path
          end

          lines.join("\n")
        end
      end
    end
  end
end
