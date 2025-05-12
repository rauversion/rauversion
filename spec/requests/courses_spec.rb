require 'rails_helper'

RSpec.describe "Courses", type: :request do
  include FactoryBot::Syntax::Methods
  let(:user) { create(:user) }
  let(:valid_attributes) { { title: "Test Course", description: "A test course", user_id: user.id, category: "test" } }
  let!(:course) { Course.create!(title: "Sample", description: "Sample desc", user: user, category: "test") }

  before do
    allow_any_instance_of(CoursesController).to receive(:current_user).and_return(user)
  end

  describe "GET /courses" do
    it "returns http success" do
      get "/courses"
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /courses" do
    it "creates a new course" do
      expect {
        post "/courses.json", params: { course: valid_attributes }
      }.to change(Course, :count).by(1)

      unless response.redirect? || response.successful?
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
      end
      expect(response).to have_http_status(:redirect).or have_http_status(:success)
    end
  end

  describe "DELETE /courses/:id" do
    it "destroys the requested course" do
      expect {
        delete "/courses/#{course.id}"
      }.to change(Course, :count).by(-1)
      expect(response).to have_http_status(:redirect).or have_http_status(:success)
    end
  end
end
