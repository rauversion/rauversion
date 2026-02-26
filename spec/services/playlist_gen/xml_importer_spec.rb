require "rails_helper"

RSpec.describe PlaylistGen::Rekordbox::XmlImporter do
  let(:library_upload) { PlaylistGen::LibraryUpload.create!(status: "pending", source: "rekordbox") }

  describe ".call" do
    context "with no file attached" do
      it "marks upload as failed" do
        result = described_class.call(library_upload)
        
        expect(result.status).to eq("failed")
        expect(result.error_message).to include("No file attached")
      end
    end

    context "with valid Rekordbox XML" do
      let(:xml_content) do
        <<~XML
          <?xml version="1.0" encoding="UTF-8"?>
          <DJ_PLAYLISTS Version="1.0.0">
            <COLLECTION Entries="3">
              <TRACK TrackID="1" Name="Track One" Artist="Artist A" Genre="House" AverageBpm="122.50" Tonality="8A" TotalTime="360" Rating="102" Location="file://localhost/Music/track1.mp3"/>
              <TRACK TrackID="2" Name="Track Two" Artist="Artist B" Genre="Tech House" AverageBpm="124.00" Tonality="9A" TotalTime="420" Rating="153" Location="file://localhost/Music/track2.mp3"/>
              <TRACK TrackID="3" Name="Track Three" Artist="Artist A" Genre="House" AverageBpm="126.00" Tonality="10A" TotalTime="300" Rating="204" Location="file://localhost/Music/track3.mp3"/>
            </COLLECTION>
          </DJ_PLAYLISTS>
        XML
      end

      before do
        library_upload.file.attach(
          io: StringIO.new(xml_content),
          filename: "collection.xml",
          content_type: "application/xml"
        )
      end

      it "imports tracks successfully" do
        result = described_class.call(library_upload)

        expect(result.status).to eq("completed")
        expect(result.total_tracks_imported).to eq(3)
        expect(PlaylistGen::Track.count).to eq(3)
      end

      it "creates tracks with correct attributes" do
        described_class.call(library_upload)

        track = PlaylistGen::Track.find_by(external_id: "1")
        expect(track.title).to eq("Track One")
        expect(track.artist).to eq("Artist A")
        expect(track.genre).to eq("House")
        expect(track.bpm.to_f).to eq(122.50)
        expect(track.key).to eq("8A")
        expect(track.duration_seconds).to eq(360)
        expect(track.file_path).to eq("/Music/track1.mp3")
        expect(track.source).to eq("rekordbox")
        expect(track.energy).to eq(4)
      end

      it "updates existing tracks on re-import" do
        # First import
        described_class.call(library_upload)
        
        # Update XML and re-import
        updated_xml = xml_content.gsub("Track One", "Updated Track One")
        library_upload.file.attach(
          io: StringIO.new(updated_xml),
          filename: "collection.xml",
          content_type: "application/xml"
        )
        
        described_class.call(library_upload)

        expect(PlaylistGen::Track.count).to eq(3)
        expect(PlaylistGen::Track.find_by(external_id: "1").title).to eq("Updated Track One")
      end
    end

    context "with invalid XML" do
      before do
        library_upload.file.attach(
          io: StringIO.new("<invalid>xml"),
          filename: "collection.xml",
          content_type: "application/xml"
        )
      end

      it "marks upload as failed" do
        result = described_class.call(library_upload)
        
        expect(result.status).to eq("failed")
        expect(result.error_message).to include("COLLECTION node not found")
      end
    end
  end

  describe "rating to energy mapping" do
    let(:xml_with_ratings) do
      <<~XML
        <?xml version="1.0" encoding="UTF-8"?>
        <DJ_PLAYLISTS Version="1.0.0">
          <COLLECTION Entries="5">
            <TRACK TrackID="1" Name="Track 1" Rating="0" TotalTime="300"/>
            <TRACK TrackID="2" Name="Track 2" Rating="51" TotalTime="300"/>
            <TRACK TrackID="3" Name="Track 3" Rating="102" TotalTime="300"/>
            <TRACK TrackID="4" Name="Track 4" Rating="153" TotalTime="300"/>
            <TRACK TrackID="5" Name="Track 5" Rating="255" TotalTime="300"/>
          </COLLECTION>
        </DJ_PLAYLISTS>
      XML
    end

    before do
      library_upload.file.attach(
        io: StringIO.new(xml_with_ratings),
        filename: "collection.xml",
        content_type: "application/xml"
      )
    end

    it "maps ratings to energy levels correctly" do
      described_class.call(library_upload)

      expect(PlaylistGen::Track.find_by(external_id: "1").energy).to be_nil
      expect(PlaylistGen::Track.find_by(external_id: "2").energy).to eq(2)
      expect(PlaylistGen::Track.find_by(external_id: "3").energy).to eq(4)
      expect(PlaylistGen::Track.find_by(external_id: "4").energy).to eq(6)
      expect(PlaylistGen::Track.find_by(external_id: "5").energy).to eq(10)
    end
  end
end
