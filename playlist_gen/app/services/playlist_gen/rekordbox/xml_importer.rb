module PlaylistGen
  module Rekordbox
    class XmlImporter
      attr_reader :library_upload, :errors

      def self.call(library_upload)
        new(library_upload).call
      end

      def initialize(library_upload)
        @library_upload = library_upload
        @errors = []
      end

      def call
        library_upload.update!(status: "processing")

        unless library_upload.file.attached?
          return mark_failed("No file attached")
        end

        tracks_imported = 0

        begin
          xml_content = library_upload.file.download
          doc = Nokogiri::XML(xml_content)

          collection = doc.at_xpath("//COLLECTION")
          unless collection
            return mark_failed("Invalid Rekordbox XML: COLLECTION node not found")
          end

          collection.xpath("TRACK").each do |track_node|
            begin
              _track, created = import_track(track_node)
              tracks_imported += 1 if created
            rescue StandardError => e
              @errors << "Track #{track_node['TrackID']}: #{e.message}"
            end
          end

          # Import playlists (if present) after we have all tracks in place
          import_playlists(doc)

          library_upload.update!(
            status: "completed",
            total_tracks_imported: tracks_imported,
            error_message: @errors.any? ? @errors.join("; ") : nil
          )

          library_upload
        rescue Nokogiri::XML::SyntaxError => e
          mark_failed("XML parsing error: #{e.message}")
        rescue StandardError => e
          mark_failed("Import error: #{e.message}")
        end
      end

      private

      # Returns [track, created]
      # - track: PlaylistGen::Track instance
      # - created: true if the track was newly created, false if it already existed
      def import_track(node)
        external_id = node["TrackID"]

        track = PlaylistGen::Track.find_or_initialize_by(
          external_id: external_id,
          source: "rekordbox"
        )

        created = track.new_record?

        track.assign_attributes(
          title: node["Name"] || "Untitled",
          artist: node["Artist"],
          genre: node["Genre"],
          bpm: parse_bpm(node["AverageBpm"] || node["Tempo"]),
          key: node["Tonality"],
          duration_seconds: parse_duration(node["TotalTime"]),
          file_path: parse_file_path(node["Location"]),
          energy: map_rating_to_energy(node["Rating"])
        )

        track.save!
        [track, created]
      end

      def import_playlists(doc)
        playlists_root = doc.at_xpath("//PLAYLISTS")
        return unless playlists_root

        # Rekordbox usually has a ROOT node (Type="0") under PLAYLISTS
        root_node = playlists_root.at_xpath("NODE[@Type='0']") || playlists_root
        import_playlist_node(root_node)
      end

      # Recursively walks the NODE tree and imports playlists (Type="1")
      def import_playlist_node(node, parent_path: nil)
        node_name = node["Name"]

        # Build a full path for nested playlists, ignoring the generic ROOT label
        current_path = if node_name.present? && node_name != "ROOT"
          parent_path.present? ? "#{parent_path} / #{node_name}" : node_name
        else
          parent_path
        end

        # Type="1" represents an actual playlist with TRACK children
        if node["Type"] == "1" && current_path.present?
          import_single_playlist(node, current_path)
        end

        # Recurse into children
        node.xpath("NODE").each do |child_node|
          import_playlist_node(child_node, parent_path: current_path)
        end
      end

      def import_single_playlist(node, playlist_name)
        playlist = PlaylistGen::Playlist.find_or_initialize_by(name: playlist_name)
        playlist.status ||= "generated"
        playlist.generated_at ||= Time.current
        playlist.save!

        # Start positions after the last existing one to keep a stable order on re-imports
        position = playlist.playlist_tracks.maximum(:position).to_i

        node.xpath("TRACK").each do |track_ref|
          external_id = track_ref["Key"]
          next if external_id.blank?

          track = PlaylistGen::Track.find_by(external_id: external_id, source: "rekordbox")
          next unless track

          playlist_track = PlaylistGen::PlaylistTrack.find_or_initialize_by(
            playlist: playlist,
            track: track
          )

          if playlist_track.new_record?
            position += 1
            playlist_track.position = position
            playlist_track.save!
          end
        end

        # Keep total_tracks in sync
        playlist.update!(total_tracks: playlist.playlist_tracks.count)

        playlist
      end

      def parse_bpm(tempo)
        return nil if tempo.blank?
        tempo.to_f.round(2)
      end

      def parse_duration(total_time)
        return nil if total_time.blank?
        total_time.to_i
      end

      def parse_file_path(location)
        return nil if location.blank?
        
        # Rekordbox stores paths as URI encoded file:// URLs
        # e.g., "file://localhost/Users/dj/Music/track.mp3"
        decoded = CGI.unescape(location.to_s)
        decoded.gsub(%r{^file://localhost}, "")
      end

      def map_rating_to_energy(rating)
        return nil if rating.blank?
        
        rating_int = rating.to_i
        return nil if rating_int == 0
        
        # Rekordbox rating: 0-255 (usually 0, 51, 102, 153, 204, 255 for 0-5 stars)
        # Map to energy 1-10
        if rating_int <= 0
          nil
        elsif rating_int <= 51
          2
        elsif rating_int <= 102
          4
        elsif rating_int <= 153
          6
        elsif rating_int <= 204
          8
        else
          10
        end
      end

      def mark_failed(message)
        library_upload.update!(
          status: "failed",
          error_message: message
        )
        library_upload
      end
    end
  end
end
