module PlaylistGen
  module Api
    module V1
      class SetsController < ApplicationController
        def generate
          playlist = SetGenerator.call(
            name: set_params[:name] || "Auto Set",
            duration_minutes: set_params[:duration_minutes].to_i,
            bpm_min: set_params[:bpm_min],
            bpm_max: set_params[:bpm_max],
            genres: set_params[:genres] || [],
            energy_curve: set_params[:energy_curve] || :linear_up,
            prompt: set_params[:prompt]
          )

          render json: { playlist: playlist_json(playlist) }, status: :created
        rescue SetGenerator::GenerationError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        private

        def set_params
          params.permit(:name, :duration_minutes, :bpm_min, :bpm_max, :energy_curve, :prompt, genres: [])
        end

        def playlist_json(playlist)
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
            prompt: playlist.prompt,
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
            duration_human: playlist_track.duration_human,
            file_path: track.file_path
          }
        end
      end
    end
  end
end
