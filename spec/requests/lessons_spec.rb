require 'rails_helper'

RSpec.describe "Lessons", type: :request do
  include FactoryBot::Syntax::Methods
  let(:user) { create(:user) }
  let(:course) { Course.create!(title: "Test Course", description: "desc", user: user, category: "test") }
  let(:course_module) { CourseModule.create!(title: "Module 1", course: course) }
  let(:valid_attributes) { { title: "Lesson 1", duration: 10, lesson_type: "video", description: "desc" } }
  let!(:lesson) { Lesson.create!(title: "Sample Lesson", duration: 5, lesson_type: "video", description: "desc", course_module: course_module) }

  before do
    allow_any_instance_of(LessonsController).to receive(:current_user).and_return(user)
  end

  describe "GET /course_modules/:course_module_id/lessons" do
    it "returns http success" do
      get "/courses/#{course.id}/course_modules/#{course_module.id}/lessons.json"
      unless response.successful?
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
      end
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /course_modules/:course_module_id/lessons" do
    it "creates a new lesson" do
      expect {
        post "/courses/#{course.id}/course_modules/#{course_module.id}/lessons.json", params: { lesson: valid_attributes }
      }.to change(Lesson, :count).by(1)
      unless response.redirect? || response.successful?
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
      end
      expect(response).to have_http_status(:redirect).or have_http_status(:success).or have_http_status(:created)
    end
  end

  describe "DELETE /course_modules/:course_module_id/lessons/:id.json" do
    it "destroys the requested lesson" do
      expect {
        delete "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}.json"
      }.to change(Lesson, :count).by(-1)
      expect(response).to have_http_status(:redirect).or have_http_status(:success).or have_http_status(:no_content)
    end
  end
end
