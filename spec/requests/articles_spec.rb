require "rails_helper"

RSpec.describe "Articles", type: :request do
  describe "PUT /articles/:id.json" do
    let(:user) { create(:user, confirmed_at: Time.current) }
    let(:article) { create(:post, user: user) }
    let!(:category) { create(:category, name: "News") }

    before do
      sign_in user
    end

    it "returns signed_id and category data on success" do
      put "/articles/#{article.slug}.json", params: {
        post: {
          title: "Updated title",
          excerpt: "Updated excerpt",
          state: "draft",
          category_id: category.id
        }
      }

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body).fetch("article")

      expect(payload).to include(
        "title" => "Updated title",
        "signed_id" => article.reload.signed_id
      )
      expect(payload.fetch("category")).to include(
        "id" => category.id,
        "name" => "News"
      )
    end

    it "returns field errors and full error messages for validation failures" do
      allow_any_instance_of(Post).to receive(:update) do |post, *_args|
        post.errors.add(:title, "can't be blank")
        post.errors.add(:base, "Body is invalid")
        false
      end

      put "/articles/#{article.slug}.json", params: {
        post: {
          title: "",
          state: article.state
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)

      payload = JSON.parse(response.body)

      expect(payload.fetch("errors")).to include(
        "title" => ["can't be blank"],
        "base" => ["Body is invalid"]
      )
      expect(payload.fetch("full_errors")).to include("Title can't be blank", "Body is invalid")
    end
  end
end
