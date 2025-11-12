require 'rails_helper'

RSpec.describe Photo, type: :model do
  let(:user) { User.create!(username: "testuser", email: "test@example.com", password: "password123", confirmed_at: Time.now) }

  describe "associations" do
    it { should belong_to(:user).optional }
    it { should belong_to(:photoable).optional }
  end

  describe "polymorphic photoable association" do
    context "when associated with a User" do
      it "can belong to a user through photoable" do
        photo = user.photos.create!
        photo.update!(photoable: user)

        expect(photo.photoable).to eq(user)
        expect(photo.photoable_type).to eq("User")
        expect(photo.photoable_id).to eq(user.id)
      end
    end

    context "when associated with a PressKit" do
      let(:press_kit) { user.create_press_kit!(data: { artistName: "Test Artist" }) }

      it "can belong to a press kit through photoable" do
        photo = Photo.create!(user: user, photoable: press_kit)

        expect(photo.photoable).to eq(press_kit)
        expect(photo.photoable_type).to eq("PressKit")
        expect(photo.photoable_id).to eq(press_kit.id)
      end

      it "can be created through the press_kit.photos association" do
        photo = press_kit.photos.create!(user: user, description: "Test photo")

        expect(photo.photoable).to eq(press_kit)
        expect(photo.photoable_type).to eq("PressKit")
        expect(photo.user).to eq(user)
      end

      it "can have Active Storage attachment" do
        photo = press_kit.photos.create!(user: user)
        
        photo.image.attach(
          io: StringIO.new("fake image data"),
          filename: "test.jpg",
          content_type: "image/jpeg"
        )

        expect(photo.image).to be_attached
        expect(photo.image.filename.to_s).to eq("test.jpg")
      end
    end
  end

  describe "validations" do
    it "requires image on create" do
      photo = Photo.new(user: user)
      expect(photo).not_to be_valid
      expect(photo.errors[:image]).to include("can't be blank")
    end

    it "allows update without image if already exists" do
      photo = Photo.new(user: user)
      photo.image.attach(
        io: StringIO.new("fake image data"),
        filename: "test.jpg",
        content_type: "image/jpeg"
      )
      photo.save!

      photo.description = "Updated description"
      expect(photo).to be_valid
      expect(photo.save).to be true
    end
  end
end
