require "rails_helper"

RSpec.describe PressKit, type: :model do
  let(:user) { User.create!(username: "testartist", email: "test@example.com", password: "password123", confirmed_at: Time.now) }
  
  describe "associations" do
    it { should belong_to(:user) }
    it { should have_many(:photos) }
  end

  describe "validations" do
    it { should validate_presence_of(:data) }
  end

  describe "default data" do
    it "initializes with default data structure" do
      press_kit = user.build_press_kit
      
      expect(press_kit.data).to be_a(Hash)
      expect(press_kit.data).to have_key(:artistName)
      expect(press_kit.data).to have_key(:bio)
      expect(press_kit.data[:bio]).to have_key(:intro)
    end
  end

  describe "data storage" do
    it "stores and retrieves jsonb data" do
      press_kit = user.create_press_kit!(
        data: {
          artistName: "Test Artist",
          tagline: "Electronic Producer",
          bio: {
            intro: "Test intro",
            career: "Test career",
            sound: "Test sound"
          }
        }
      )

      press_kit.reload
      expect(press_kit.data['artistName']).to eq("Test Artist")
      expect(press_kit.data['tagline']).to eq("Electronic Producer")
    end
  end

  describe "polymorphic photo association" do
    let(:press_kit) { user.create_press_kit!(data: { artistName: "Test" }) }

    it "can have associated photos through photoable polymorphic relationship" do
      photo = press_kit.photos.create!(user: user)
      
      expect(press_kit.photos.count).to eq(1)
      expect(press_kit.photos.first).to eq(photo)
      expect(photo.photoable).to eq(press_kit)
      expect(photo.photoable_type).to eq("PressKit")
      expect(photo.photoable_id).to eq(press_kit.id)
    end

    it "can have multiple photos associated" do
      photo1 = press_kit.photos.create!(user: user, description: "Photo 1")
      photo2 = press_kit.photos.create!(user: user, description: "Photo 2")
      
      expect(press_kit.photos.count).to eq(2)
      expect(press_kit.photos).to include(photo1, photo2)
    end

    it "destroys associated photos when press kit is destroyed" do
      photo = press_kit.photos.create!(user: user)
      photo_id = photo.id
      
      expect { press_kit.destroy }.to change { Photo.count }.by(-1)
      expect(Photo.find_by(id: photo_id)).to be_nil
    end

    it "allows querying photos through the association" do
      press_kit.photos.create!(user: user, description: "First photo")
      press_kit.photos.create!(user: user, description: "Second photo")
      
      queried_photos = press_kit.photos.where("description LIKE ?", "%photo%")
      expect(queried_photos.count).to eq(2)
    end
  end
end
