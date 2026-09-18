require "rails_helper"

RSpec.describe "Course access", type: :request do
  let(:owner) { create(:user, confirmed_at: Time.current) }
  let(:student) { create(:user, confirmed_at: Time.current) }
  let(:course) { create(:course, user: owner, published: true, price: 0, enrollment_type: "free") }
  let(:course_module) { create(:course_module, course: course) }
  let!(:lesson) { create(:lesson, course_module: course_module, description: "Private lesson content", youtube_url: "https://youtu.be/M7lc1UVf-VE") }
  let!(:document) { create(:course_document, course: course, lesson: lesson) }

  def lesson_path
    "/courses/#{course.id}/lessons/#{lesson.id}.json"
  end

  it "shows the course and syllabus without leaking restricted lesson content" do
    get "/courses/#{course.id}.json"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("course", "can_access_content")).to be(false)
    get "/courses/#{course.id}/course_modules.json"
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("course_modules").first.fetch("lessons").first
    expect(data["title"]).to eq(lesson.title)
    expect(data.values_at("description", "video_url", "youtube_url", "documents")).to eq([nil, nil, nil, []])
  end

  it "blocks direct lessons, video streams and resources without enrollment" do
    sign_in student
    [lesson_path,
      "/courses/#{course.id}/course_modules/#{course_module.id}/lessons.json",
      "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}/stream.json",
      "/courses/#{course.id}/course_documents.json",
      "/courses/#{course.id}/course_documents/#{document.id}/download.json"].each do |path|
      get path
      expect(response).to have_http_status(:forbidden), path
      expect(response.body).not_to include(lesson.youtube_url)
    end
  end

  it "lets anonymous visitors read public lessons and resources" do
    course.update!(enrollment_type: "public")
    get lesson_path
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("lesson", "youtube_url")).to eq(lesson.youtube_url)
    get "/courses/#{course.id}/course_documents.json"
    expect(response).to have_http_status(:ok)
  end

  it "lets an enrolled student read lessons and lesson resources" do
    sign_in student
    course.course_enrollments.create!(user: student)
    get lesson_path
    expect(response).to have_http_status(:ok)
    get "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}/course_documents.json"
    expect(response.parsed_body.map { |item| item["id"] }).to eq([document.id])
  end

  it "streams uploaded videos only after enrollment" do
    lesson.video.attach(io: StringIO.new("video content"), filename: "lesson.mp4", content_type: "video/mp4", identify: false)
    course.course_enrollments.create!(user: student)
    sign_in student
    get "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}/stream.json", headers: { "Range" => "bytes=0-" }
    expect(response).to have_http_status(:partial_content)
    expect(response.body).to eq("video content")
  end

  it "allows the owner to preview a draft and hides it from other people" do
    course.update!(published: false)
    get lesson_path
    expect(response).to have_http_status(:not_found)
    sign_in owner
    get lesson_path
    expect(response).to have_http_status(:ok)
  end

  it "unlocks an invite-only course after the owner enrolls the student" do
    course.update!(enrollment_type: "invite")
    sign_in owner
    post "/courses/#{course.id}/invite.json", params: { email: student.email }
    expect(response).to have_http_status(:created)
    sign_in student
    get lesson_path
    expect(response).to have_http_status(:ok)
  end

  it "does not let enrolled students edit course content or invite other users" do
    sign_in student
    course.course_enrollments.create!(user: student)
    patch "/courses/#{course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}.json", params: { lesson: { title: "Changed" } }
    expect(response).to have_http_status(:forbidden)
    post "/courses/#{course.id}/invite.json", params: { email: student.email }
    expect(response).to have_http_status(:forbidden)
    delete "/courses/#{course.id}/course_documents/#{document.id}.json"
    expect(response).to have_http_status(:forbidden)
  end

  it "scopes lesson routes to the requested course" do
    sign_in owner
    other_course = create(:course, user: owner, price: 0)
    get "/courses/#{other_course.id}/course_modules/#{course_module.id}/lessons/#{lesson.id}/stream.json"
    expect(response).to have_http_status(:not_found)
  end

  it "does not expose a course belonging to another tenant" do
    course.update!(tenant: create(:tenant))
    sign_in owner
    get lesson_path
    expect(response).to have_http_status(:not_found)
  end
end
