require 'rails_helper'

RSpec.describe "PressKits", type: :request do
  let(:user) { User.create!(username: "testartist", email: "test@example.com", password: "password123", confirmed_at: Time.now) }
  let(:other_user) { User.create!(username: "otherartist", email: "other@example.com", password: "password123", confirmed_at: Time.now) }
  
  describe "GET /:username/press-kit" do
    context "when press kit exists" do
      before do
        user.create_press_kit!(
          data: {
            artistName: "Test Artist",
            tagline: "Electronic Producer"
          }
        )
      end

      it "returns the press kit data" do
        get "/#{user.username}/press-kit"
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['press_kit']).to be_present
        expect(json_response['press_kit']['data']['artistName']).to eq("Test Artist")
      end
    end

    context "when press kit does not exist" do
      it "returns null press kit" do
        get "/#{user.username}/press-kit"
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['press_kit']).to be_nil
      end
    end
  end

  describe "PATCH /:username/press-kit" do
    context "when authenticated as the owner" do
      before do
        sign_in user
      end

      it "creates or updates the press kit" do
        patch "/#{user.username}/press-kit", params: {
          press_kit: {
            data: JSON.generate({
              artistName: "New Artist Name",
              tagline: "New Tagline"
            })
          }
        }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['press_kit']['data']['artistName']).to eq("New Artist Name")
        
        user.reload
        expect(user.press_kit).to be_present
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        patch "/#{user.username}/press-kit", params: {
          press_kit: {
            data: JSON.generate({
              artistName: "Hacker"
            })
          }
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as different user" do
      before do
        sign_in other_user
      end

      it "returns unauthorized" do
        patch "/#{user.username}/press-kit", params: {
          press_kit: {
            data: JSON.generate({
              artistName: "Hacker"
            })
          }
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when uploading photos with Active Storage" do
      before do
        sign_in user
      end

      it "creates Photo records associated with PressKit via photoable" do
        # Create a blob to simulate a direct upload
        blob = ActiveStorage::Blob.create_before_direct_upload!(
          filename: "test_photo.jpg",
          byte_size: 1024,
          checksum: "abc123",
          content_type: "image/jpeg"
        )

        patch "/#{user.username}/press-kit", params: {
          press_kit: {
            data: JSON.generate({
              artistName: "Test Artist",
              pressPhotos: [
                {
                  title: "Press Photo 1",
                  resolution: "1920x1080",
                  image: "",
                  signed_id: blob.signed_id
                }
              ]
            })
          }
        }

        expect(response).to have_http_status(:success)
        
        user.reload
        press_kit = user.press_kit
        
        # Verify the Photo record was created and associated with PressKit
        expect(press_kit.photos.count).to eq(1)
        photo = press_kit.photos.first
        expect(photo.photoable).to eq(press_kit)
        expect(photo.photoable_type).to eq("PressKit")
        expect(photo.user).to eq(user)
      end

      it "returns photos array in the API response" do
        press_kit = user.create_press_kit!(data: { artistName: "Test" })
        photo = press_kit.photos.create!(user: user, description: "Test photo")
        
        # Create a test file for Active Storage
        photo.image.attach(
          io: StringIO.new("fake image data"),
          filename: "test.jpg",
          content_type: "image/jpeg"
        )

        get "/#{user.username}/press-kit.json"
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        
        # Verify the photos array is present in the response
        expect(json_response['press_kit']['photos']).to be_present
        expect(json_response['press_kit']['photos'].length).to eq(1)
        expect(json_response['press_kit']['photos'][0]['id']).to eq(photo.id)
        expect(json_response['press_kit']['photos'][0]['description']).to eq("Test photo")
        expect(json_response['press_kit']['photos'][0]['url']).to be_present
      end

      it "allows querying photos through the press_kit.photos association" do
        press_kit = user.create_press_kit!(data: { artistName: "Test" })
        photo1 = press_kit.photos.create!(user: user, description: "Photo 1")
        photo2 = press_kit.photos.create!(user: user, description: "Photo 2")

        get "/#{user.username}/press-kit.json"
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        
        # Verify all photos are queryable through the association
        photo_ids = json_response['press_kit']['photos'].map { |p| p['id'] }
        expect(photo_ids).to match_array([photo1.id, photo2.id])
      end
    end
  end
end
