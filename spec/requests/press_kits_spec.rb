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

      xit "returns the press kit data" do
        get "/#{user.username}/press-kit"
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['press_kit']).to be_present
        expect(json_response['press_kit']['data']['artistName']).to eq("Test Artist")
      end
    end

    context "when press kit does not exist" do
      xit "returns null press kit" do
        get "/#{user.username}/press-kit"
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['press_kit']).to be_nil
      end
    end

    it "returns active performance services for booking from the press kit" do
      user.create_press_kit!(data: { artistName: "Test", published: true })
      performance = create(
        :service_product,
        user: user,
        title: "Festival DJ Set",
        description: "A club-ready DJ set.",
        service_kind: "performance",
        category: "dj_set",
        booking_mode: "request_quote",
        delivery_method: "in_person",
        price: 800_000,
        currency: "clp",
        duration_minutes: 90,
        performance_format: "DJ set",
        home_city: "Santiago",
        home_country: "Chile"
      )
      create(
        :service_price_rule,
        service_product: performance,
        name: "Extra hour",
        rule_type: "extra_hour",
        amount: 150_000,
        currency: "clp"
      )
      create(:service_product, user: user, service_kind: "advisory", status: "active")
      create(:service_product, user: user, service_kind: "performance", status: "inactive")
      create(:service_product, service_kind: "performance", status: "active")

      get "/#{user.username}/press-kit.json"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      services = json_response.dig("press_kit", "performer_services")

      expect(services.length).to eq(1)
      expect(services.first).to include(
        "id" => performance.id,
        "title" => "Festival DJ Set",
        "category" => "dj_set",
        "service_kind" => "performance",
        "booking_mode" => "request_quote"
      )
      expect(services.first["formatted_price"]).to include("CLP")
      expect(services.first["formatted_price"]).to match(/800[,.]000/)
      expect(services.first["path"]).to eq("/#{user.username}/products/#{performance.slug}")
      expect(services.first["user"]).to include(
        "id" => user.id,
        "username" => user.username
      )
      expect(services.first["service_price_rules"].first).to include(
        "name" => "Extra hour"
      )
      expect(services.first["service_price_rules"].first["formatted_amount"]).to include("CLP")
      expect(services.first["service_price_rules"].first["formatted_amount"]).to match(/150[,.]000/)
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
              tagline: "New Tagline",
              technicalRider: "2 CDJ-3000 and 1 DJM-900NXS2"
            })
          }
        }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['press_kit']['data']['artistName']).to eq("New Artist Name")
        expect(json_response['press_kit']['data']['technicalRider']).to eq("2 CDJ-3000 and 1 DJM-900NXS2")
        
        user.reload
        expect(user.press_kit).to be_present
      end

      it "persists the design and ordered videos and returns them to public visitors after publication" do
        videos = [
          { title: "Live set", url: "https://youtu.be/M7lc1UVf-VE", aspectRatio: "landscape" },
          { title: "Backstage", url: "https://www.instagram.com/reel/ABC123/", description: "Festival footage", aspectRatio: "auto" }
        ]
        patch "/#{user.username}/press-kit.json", params: {
          press_kit: { data: JSON.generate({ artistName: "Test Artist", published: true, template: "editorial", theme: "light", heroPhotoId: "42", videos: videos }) }
        }

        expect(response).to have_http_status(:ok)
        expect(user.reload.press_kit.data["videos"]).to eq(videos.map(&:stringify_keys))
        expect(user.press_kit.data).to include("template" => "editorial", "theme" => "light", "heroPhotoId" => "42")

        sign_out user
        get "/#{user.username}/press-kit.json"

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body).dig("press_kit", "data", "videos")).to eq(videos.map(&:stringify_keys))
        expect(JSON.parse(response.body).dig("press_kit", "data")).to include("template" => "editorial", "theme" => "light", "heroPhotoId" => "42")
      end

      it "saves photo order, ignores duplicate and foreign IDs, and appends unlisted photos" do
        kit = user.create_press_kit!(data: { artistName: "Test Artist", published: true })
        first, second, third = 3.times.map { kit.photos.create!(user: user) }
        other_kit = other_user.create_press_kit!(data: { artistName: "Other Artist" })
        foreign_photo = other_kit.photos.create!(user: other_user)

        patch "/#{user.username}/press-kit.json", params: {
          press_kit: { data: JSON.generate({ artistName: "Test Artist", published: true, photo_ids: [third.id.to_s, foreign_photo.id, third.id, first.id] }) }
        }

        expect(response).to have_http_status(:ok)
        expected_order = [third.id, first.id, second.id]
        expect(kit.reload.data["photo_ids"]).to eq(expected_order)
        expect(JSON.parse(response.body).dig("press_kit", "photos").pluck("id")).to eq(expected_order)
        expect(foreign_photo.reload.photoable).to eq(other_kit)

        sign_out user
        get "/#{user.username}/press-kit.json"

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body).dig("press_kit", "photos").pluck("id")).to eq(expected_order)
      end

      it "preserves photo order when an older client updates other content" do
        kit = user.create_press_kit!(data: { artistName: "Test Artist" })
        first, second = 2.times.map { kit.photos.create!(user: user) }
        kit.update!(data: kit.data.merge("photo_ids" => [second.id, first.id]))

        patch "/#{user.username}/press-kit.json", params: { press_kit: { data: JSON.generate({ artistName: "Updated Artist" }) } }

        expect(response).to have_http_status(:ok)
        expect(kit.reload.data).to include("artistName" => "Updated Artist", "photo_ids" => [second.id, first.id])
      end

      it "keeps tour dates in the artist's chosen order" do
        dates = [
          { id: "berlin", date: "July 20", venue: "Berlin show", city: "Berlin" },
          { id: "tallinn", date: "July 10", venue: "Tallinn show", city: "Tallinn" }
        ]
        patch "/#{user.username}/press-kit.json", params: {
          press_kit: { data: JSON.generate({ artistName: "Test Artist", published: true, tourDates: dates }) }
        }

        expect(response).to have_http_status(:ok)
        expect(user.reload.press_kit.data["tourDates"]).to eq(dates.map(&:stringify_keys))

        sign_out user
        get "/#{user.username}/press-kit.json"

        expect(JSON.parse(response.body).dig("press_kit", "data", "tourDates")).to eq(dates.map(&:stringify_keys))
      end

      it "prepends newly uploaded photos and preserves the existing photos' order" do
        kit = user.create_press_kit!(data: { artistName: "Test Artist" })
        first, second = 2.times.map { kit.photos.create!(user: user) }
        kit.update!(data: kit.data.merge("photo_ids" => [second.id, first.id]))
        blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("test image"), filename: "press.jpg", content_type: "image/jpeg", identify: false)

        patch "/#{user.username}/press-kit.json", params: {
          press_kit: { data: JSON.generate({ artistName: "Test Artist", pressPhotos: [{ signed_id: blob.signed_id }] }) }
        }

        expect(response).to have_http_status(:ok)
        new_photo = kit.photos.order(:id).last
        expect(new_photo.image.blob).to eq(blob)
        expect(kit.reload.data["photo_ids"]).to eq([new_photo.id, second.id, first.id])
        expect(JSON.parse(response.body).dig("press_kit", "photos").pluck("id")).to eq([new_photo.id, second.id, first.id])
      end
    end

    context "when not authenticated" do
      xit "returns unauthorized" do
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

      it "does not allow updating another artist's press kit" do
        kit = user.create_press_kit!(data: { artistName: "Original Artist" })
        patch "/#{user.username}/press-kit.json", params: {
          press_kit: {
            data: JSON.generate({
              artistName: "Hacker"
            })
          }
        }

        expect(response).to have_http_status(:unauthorized)
        expect(kit.reload.data["artistName"]).to eq("Original Artist")
      end
    end

    context "when uploading photos with Active Storage" do
      before do
        sign_in user
      end

      xit "creates Photo records associated with PressKit via photoable" do
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
        expect(json_response['press_kit']['photos'][0]['pdf_url']).to be_present
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
