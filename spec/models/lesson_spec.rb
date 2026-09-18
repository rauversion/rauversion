require 'rails_helper'

RSpec.describe Lesson, type: :model do
  let(:lesson) { build(:lesson, course_module: build(:course_module)) }
  let(:youtube_urls) { JSON.parse(Rails.root.join("spec/fixtures/youtube_urls.json").read) }

  it "accepts supported YouTube video links and extracts the video ID" do
    youtube_urls.fetch("valid").each do |url|
      lesson.youtube_url = url

      expect(lesson).to be_valid, url
      expect(lesson.youtube_video_id).to eq(youtube_urls.fetch("video_id")), url
    end
  end

  it "rejects non-video links, unsafe hosts and invalid IDs" do
    youtube_urls.fetch("invalid").each do |url|
      lesson.youtube_url = url

      expect(lesson).not_to be_valid, url
      expect(lesson.errors[:youtube_url]).to be_present, url
      expect(lesson.youtube_video_id).to be_nil, url
    end
  end

  it "keeps YouTube optional for uploaded videos and other lesson types" do
    [nil, "", "  "].each do |url|
      lesson.youtube_url = url

      expect(lesson).to be_valid
      expect(lesson.youtube_url).to be_nil
      expect(lesson.youtube_video_id).to be_nil
    end
  end
end
