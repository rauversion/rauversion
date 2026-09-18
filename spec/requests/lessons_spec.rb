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
    it "creates a YouTube lesson without requiring an uploaded file" do
      expect {
        post "/courses/#{course.id}/course_modules/#{course_module.id}/lessons.json",
          params: { lesson: valid_attributes.merge(youtube_url: " https://youtu.be/M7lc1UVf-VE ") }
      }.to change(Lesson, :count).by(1)

      expect(response).to have_http_status(:no_content)
      expect(Lesson.last.youtube_url).to eq("https://youtu.be/M7lc1UVf-VE")
      expect(Lesson.last.video).not_to be_attached
    end

    it "rejects an invalid YouTube link without creating a lesson" do
      expect {
        post "/courses/#{course.id}/course_modules/#{course_module.id}/lessons.json",
          params: { lesson: valid_attributes.merge(youtube_url: "https://example.com/video") }
      }.not_to change(Lesson, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]).to be_present
    end

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

  describe "PATCH /course_modules/:course_module_id/lessons/:id" do
    it "switches to YouTube and back while preserving the uploaded video" do
      lesson.video.attach(io: StringIO.new("video content"), filename: "lesson.mp4", content_type: "video/mp4", identify: false)
      blob_id = lesson.video.blob.id

      patch "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}.json",
        params: { lesson: { youtube_url: "https://youtu.be/M7lc1UVf-VE" } }

      expect(response).to have_http_status(:no_content)
      expect(lesson.reload.youtube_video_id).to eq("M7lc1UVf-VE")
      expect(lesson.video.blob.id).to eq(blob_id)

      patch "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}.json",
        params: { lesson: { youtube_url: "" } }

      expect(response).to have_http_status(:no_content)
      expect(lesson.reload.youtube_url).to be_nil
      expect(lesson.video.blob.id).to eq(blob_id)
    end

    it "preserves the saved link if an update is invalid" do
      lesson.update!(youtube_url: "https://youtu.be/M7lc1UVf-VE")

      patch "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}.json",
        params: { lesson: { youtube_url: "https://example.com/video" } }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(lesson.reload.youtube_url).to eq("https://youtu.be/M7lc1UVf-VE")
    end
  end

  describe "YouTube lesson responses" do
    before { lesson.update!(youtube_url: "https://youtu.be/M7lc1UVf-VE") }

    it "includes the saved link when editing course modules" do
      get "/courses/#{course.id}/course_modules.json"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("course_modules").first.fetch("lessons").first["youtube_url"])
        .to eq(lesson.youtube_url)
    end

    it "includes the saved link in the student lesson response" do
      get "/courses/#{course.id}/lessons/#{lesson.id}.json"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("lesson")["youtube_url"]).to eq(lesson.youtube_url)
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
