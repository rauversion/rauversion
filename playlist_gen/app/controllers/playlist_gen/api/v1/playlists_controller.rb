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

        def export_rekordbox
          playlist = Playlist.find(params[:id])
          xml_content = generate_rekordbox_xml(playlist)

          send_data xml_content,
                    filename: "#{playlist.name.parameterize}-#{playlist.id}.xml",
                    type: "application/xml",
                    disposition: "attachment"
        end

        def export_traktor
          playlist = Playlist.find(params[:id])
          nml_content = generate_traktor_nml(playlist)

          send_data nml_content,
                    filename: "#{playlist.name.parameterize}-#{playlist.id}.nml",
                    type: "application/xml",
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
            prompt: playlist.prompt,
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

        # Rekordbox XML format placeholder
        # TODO: Implement full Rekordbox XML structure
        def generate_rekordbox_xml(playlist)
          builder = Nokogiri::XML::Builder.new(encoding: "UTF-8") do |xml|
            xml.DJ_PLAYLISTS(Version: "1.0.0") do
              xml.PRODUCT(Name: "Rauversion PlaylistGen", Version: "1.0.0", Company: "Rauversion")
              xml.COLLECTION(Entries: playlist.total_tracks) do
                playlist.playlist_tracks.includes(:track).each do |pt|
                  track = pt.track
                  xml.TRACK(
                    TrackID: track.id,
                    Name: track.title || "Unknown",
                    Artist: track.artist || "Unknown",
                    Genre: track.genre || "",
                    Kind: "MP3 File",
                    Size: "",
                    TotalTime: track.duration_seconds || 0,
                    AverageBpm: track.bpm&.to_f || 0,
                    Tonality: track.key || "",
                    Location: "file://localhost#{CGI.escape(track.file_path || '')}"
                  )
                end
              end
              xml.PLAYLISTS do
                xml.NODE(Type: "0", Name: "ROOT", Count: "1") do
                  xml.NODE(Type: "1", Name: playlist.name, KeyType: "0", Entries: playlist.total_tracks) do
                    playlist.playlist_tracks.includes(:track).each do |pt|
                      xml.TRACK(Key: pt.track.id)
                    end
                  end
                end
              end
            end
          end
          builder.to_xml
        end

        # Traktor NML format placeholder
        # TODO: Implement full Traktor NML structure
        def generate_traktor_nml(playlist)
          builder = Nokogiri::XML::Builder.new(encoding: "UTF-8") do |xml|
            xml.NML(Version: "19") do
              xml.HEAD(Company: "Rauversion", Program: "PlaylistGen")
              xml.MUSICFOLDERS
              xml.COLLECTION(Entries: playlist.total_tracks) do
                playlist.playlist_tracks.includes(:track).each do |pt|
                  track = pt.track
                  file_path = track.file_path || ""
                  dir = File.dirname(file_path)
                  filename = File.basename(file_path)
                  
                  xml.ENTRY(
                    MODIFIED_DATE: Time.current.strftime("%Y/%m/%d"),
                    MODIFIED_TIME: "0",
                    TITLE: track.title || "Unknown",
                    ARTIST: track.artist || "Unknown"
                  ) do
                    xml.LOCATION(
                      DIR: dir.gsub("/", "/:"),
                      FILE: filename,
                      VOLUME: "",
                      VOLUMEID: ""
                    )
                    xml.ALBUM(TITLE: "")
                    xml.INFO(
                      BITRATE: "320000",
                      GENRE: track.genre || "",
                      PLAYTIME: track.duration_seconds || 0,
                      PLAYTIME_FLOAT: "#{track.duration_seconds || 0}.0",
                      KEY: track.key || ""
                    )
                    xml.TEMPO(BPM: track.bpm&.to_f || 0, BPM_QUALITY: "100")
                    xml.LOUDNESS(PEAK_DB: "0", PERCEIVED_DB: "0", ANALYZED_DB: "0")
                  end
                end
              end
              xml.PLAYLISTS do
                xml.NODE(Type: "FOLDER", Name: "$ROOT") do
                  xml.SUBNODES(Count: "1") do
                    xml.NODE(Type: "PLAYLIST", Name: playlist.name) do
                      xml.PLAYLIST(Entries: playlist.total_tracks, Type: "LIST", UUID: SecureRandom.uuid) do
                        playlist.playlist_tracks.includes(:track).each do |pt|
                          track = pt.track
                          file_path = track.file_path || ""
                          dir = File.dirname(file_path)
                          filename = File.basename(file_path)
                          
                          xml.ENTRY do
                            xml.PRIMARYKEY(TYPE: "TRACK", KEY: "#{dir.gsub('/', '/:')}/#{filename}")
                          end
                        end
                      end
                    end
                  end
                end
              end
            end
          end
          builder.to_xml
        end
      end
    end
  end
end
