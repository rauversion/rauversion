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
              import_track(track_node)
              tracks_imported += 1
            rescue StandardError => e
              @errors << "Track #{track_node['TrackID']}: #{e.message}"
            end
          end

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

      def import_track(node)
        external_id = node["TrackID"]
        
        track = PlaylistGen::Track.find_or_initialize_by(
          external_id: external_id,
          source: "rekordbox"
        )

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
        track
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
