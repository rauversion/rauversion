require "rails_helper"

RSpec.describe Playlist, type: :model do
  it { belong_to(:user) }
  it { have_many(:track_playlists) }
  it { have_many(:tracks).through(:track_playlists) }
  it { have_many(:listening_events) }
  it { have_many(:comments) }
  it { have_many(:likes) }
  it { have_one_attached(:cover) }
  it { have_one_attached(:zip) }

  let!(:user) { FactoryBot.create(:user) }

  describe "scopes" do
    before do
      @playlist1 = FactoryBot.create(:playlist, private: false, user: user, created_at: 1.day.ago)
      @playlist2 = FactoryBot.create(:playlist, private: true, user: user, created_at: 2.days.ago)
      @playlist3 = FactoryBot.create(:playlist, private: false, user: user, created_at: 3.days.ago)
    end

    describe ".published" do
      it "returns only published tracks" do
        expect(Playlist.published.ids).to contain_exactly(@playlist1.id, @playlist3.id)
      end
    end

    describe ".latests" do
      it "returns tracks in descending order of creation" do
        expect(Playlist.latests.ids).to eq([@playlist3.id, @playlist2.id, @playlist1.id])
      end
    end
  end
end
