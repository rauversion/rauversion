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
  end
end
