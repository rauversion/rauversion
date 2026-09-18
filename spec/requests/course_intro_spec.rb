require "rails_helper"

RSpec.describe "Course introduction", type: :request do
  let(:owner) { create(:user, confirmed_at: Time.current) }
  let(:course) { create(:course, user: owner, published: true, enrollment_type: "paid", price: 20) }
  let(:youtube_url) { "https://youtu.be/M7lc1UVf-VE" }

  def video_blob(content_type: "video/mp4")
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("intro video content"), filename: "intro.mp4", content_type: content_type, identify: false
    )
  end

  it "creates a course with a YouTube introduction" do
    sign_in owner
    post "/courses.json", params: { course: {
      title: "New intro course", description: "Course description", category: "production",
      cover_type: "youtube", youtube_url: " #{youtube_url} "
    } }
    expect(response).to have_http_status(:created)
    data = response.parsed_body.fetch("course")
    expect(data.values_at("cover_type", "youtube_url")).to eq(["youtube", youtube_url])
    expect(Course.find(data.fetch("id")).youtube_url).to eq(youtube_url)
  end

  it "saves and serves an uploaded intro to visitors without unlocking paid lessons" do
    lesson = create(:lesson, course_module: create(:course_module, course: course))
    sign_in owner
    blob = video_blob
    patch "/courses/#{course.id}.json", params: { course: { cover_type: "video", intro_video: blob.signed_id } }
    expect(response).to have_http_status(:ok)
    expect(course.reload.intro_video.blob).to eq(blob)

    sign_out owner
    get "/courses/#{course.id}.json"
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("course")
    expect(data["cover_type"]).to eq("video")
    expect(data["intro_video_url"]).to include(blob.signed_id)
    expect(data["can_access_content"]).to be(false)
    get "/courses/#{course.id}/lessons/#{lesson.id}.json"
    expect(response).to have_http_status(:forbidden)
  end

  it "makes the selected YouTube intro public while preserving enrollment requirements" do
    course.update!(cover_type: "youtube", youtube_url: youtube_url)
    get "/courses/#{course.id}.json"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("course", "youtube_url")).to eq(youtube_url)
    expect(response.parsed_body.dig("course", "can_access_content")).to be(false)
  end

  it "switches back to an image without deleting the existing intro" do
    blob = video_blob
    course.update!(cover_type: "video", intro_video: blob)
    sign_in owner
    patch "/courses/#{course.id}.json", params: { course: { cover_type: "image" } }
    expect(response).to have_http_status(:ok)
    expect(course.reload.intro_video.blob).to eq(blob)
    expect(response.parsed_body.dig("course", "intro_video_url")).to be_present

    sign_out owner
    get "/courses/#{course.id}.json"
    expect(response.parsed_body.dig("course", "cover_type")).to eq("image")
    expect(response.parsed_body.dig("course", "intro_video_url")).to be_nil
  end

  it "keeps the existing thumbnail when selecting a YouTube introduction" do
    course.thumbnail.attach(io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")), filename: "cover.jpg", content_type: "image/jpeg")
    thumbnail_id = course.thumbnail.blob_id
    sign_in owner
    patch "/courses/#{course.id}.json", params: { course: { cover_type: "youtube", youtube_url: youtube_url } }
    expect(response).to have_http_status(:ok)
    expect(course.reload.thumbnail.blob_id).to eq(thumbnail_id)
    expect(response.parsed_body.dig("course", "thumbnail_url")).to be_present
  end

  it "rejects an invalid URL without replacing the saved cover" do
    course.update!(cover_type: "youtube", youtube_url: youtube_url)
    sign_in owner
    patch "/courses/#{course.id}.json", params: { course: { youtube_url: "https://example.com/video" } }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(course.reload.youtube_url).to eq(youtube_url)
  end

  it "rejects a non-video attachment without replacing the saved video" do
    original = video_blob
    course.update!(cover_type: "video", intro_video: original)
    sign_in owner
    patch "/courses/#{course.id}.json", params: { course: { intro_video: video_blob(content_type: "text/html").signed_id } }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(course.reload.intro_video.blob).to eq(original)
  end

  it "preserves the video when saving other settings" do
    original = video_blob
    course.update!(cover_type: "video", intro_video: original)
    sign_in owner
    patch "/courses/#{course.id}.json", params: { course: { featured: true } }
    expect(response).to have_http_status(:ok)
    expect(course.reload.intro_video.blob).to eq(original)
  end

  it "allows only the owner to change the introduction" do
    course
    sign_in create(:user, confirmed_at: Time.current)
    patch "/courses/#{course.id}.json", params: { course: { cover_type: "youtube", youtube_url: youtube_url } }
    expect(response).to have_http_status(:forbidden)
    expect(course.reload.cover_type).to eq("image")
  end

  it "does not expose a draft course introduction to visitors" do
    course.update!(published: false, cover_type: "youtube", youtube_url: youtube_url)
    get "/courses/#{course.id}.json"
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include(youtube_url)
  end
end
