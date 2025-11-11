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
end
