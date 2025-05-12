require 'rails_helper'

RSpec.describe "CourseModules", type: :request do
  include FactoryBot::Syntax::Methods
  let(:user) { create(:user) }
  let(:course) { Course.create!(title: "Test Course", description: "desc", user: user, category: "test") }
  let(:valid_attributes) { { title: "Module 1", course_id: course.id } }
  let!(:course_module) { CourseModule.create!(title: "Sample Module", course: course) }

  before do
    allow_any_instance_of(CourseModulesController).to receive(:current_user).and_return(user)
  end

  describe "GET /course_modules" do
    it "returns http success" do
      get "/course_modules"
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /course_modules" do
    it "creates a new course module" do
      expect {
        post "/course_modules", params: { course_module: valid_attributes }
      }.to change(CourseModule, :count).by(1)
      unless response.redirect? || response.successful?
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
      end
      expect(response).to have_http_status(:redirect).or have_http_status(:success)
    end
  end

  describe "DELETE /course_modules/:id" do
    it "destroys the requested course module" do
      expect {
        delete "/course_modules/#{course_module.id}"
      }.to change(CourseModule, :count).by(-1)
      expect(response).to have_http_status(:redirect).or have_http_status(:success)
    end
  end
end
