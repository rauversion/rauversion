require "rails_helper"

RSpec.describe TracksDiscoveryQuery do
  describe "#call" do
    let(:artist) { create(:user) }
    let!(:ambient_track) do
      create(
        :track,
        user: artist,
        title: "Cloud Memory",
        genre: "Ambient",
        bpm: 94,
        mood: ["Meditative"],
        analysis_accuracy: 0.87
      )
    end
    let!(:techno_track) do
      create(
        :track,
        user: artist,
        title: "Night Pulse",
        genre: "Techno",
        bpm: 128,
        mood: ["Dark"],
        analysis_accuracy: 0.92
      )
    end

    it "localizes discovery labels in Spanish" do
      result = I18n.with_locale(:es) do
        described_class.new(scope: Track.where(id: [ambient_track.id, techno_track.id]), params: {}).call
      end

      expect(result.dig(:discovery_sections, :genres, :title)).to eq("Géneros en rotación")
      expect(result.dig(:discovery_sections, :moods, :title)).to eq("Moods para explorar")
      expect(result.dig(:facets, :tempo_bands)).to include(
        include(key: "under-100", label: "Menos de 100 BPM"),
        include(key: "120-129", label: "120-129 BPM")
      )
    end

    it "localizes discovery labels in English" do
      result = I18n.with_locale(:en) do
        described_class.new(scope: Track.where(id: [ambient_track.id, techno_track.id]), params: {}).call
      end

      expect(result.dig(:discovery_sections, :genres, :title)).to eq("Genres in rotation")
      expect(result.dig(:discovery_sections, :moods, :title)).to eq("Moods to dive into")
      expect(result.dig(:facets, :tempo_bands)).to include(
        include(key: "under-100", label: "Under 100 BPM"),
        include(key: "120-129", label: "120-129 BPM")
      )
    end
  end
end
