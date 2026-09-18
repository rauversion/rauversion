require 'rails_helper'

RSpec.describe Course, type: :model do
  include FactoryBot::Syntax::Methods
  describe "associations" do
    it { should belong_to(:user) }
    it { should have_one(:course_product).class_name("Products::CourseProduct").dependent(:nullify) }
    it { should have_one_attached(:thumbnail) }
    it { should have_one_attached(:intro_video) }
    it { should have_many(:course_documents).dependent(:destroy) }
    it { should have_many(:course_modules).dependent(:destroy) }
    it { should have_many(:lessons).through(:course_modules) }
    it { should have_many(:course_enrollments) }
  end

  describe "intro media" do
    let(:course) { build(:course) }
    let(:youtube_urls) { JSON.parse(Rails.root.join("spec/fixtures/youtube_urls.json").read) }

    it "defaults to an image cover without requiring an intro video" do
      expect(course.cover_type).to eq("image")
      expect(course).to be_valid
    end

    it "accepts the same YouTube links as lessons" do
      course.cover_type = "youtube"
      youtube_urls.fetch("valid").each do |url|
        course.youtube_url = url
        expect(course).to be_valid, url
        expect(course.youtube_video_id).to eq(youtube_urls.fetch("video_id")), url
      end
    end

    it "rejects missing, unsafe or non-video YouTube URLs" do
      course.cover_type = "youtube"
      [nil, "", "  ", *youtube_urls.fetch("invalid")].each do |url|
        course.youtube_url = url
        expect(course).not_to be_valid, url.inspect
        expect(course.errors[:youtube_url]).to be_present
      end
    end

    it "requires an attached video when selected" do
      course.cover_type = "video"
      expect(course).not_to be_valid
      expect(course.errors[:intro_video]).to be_present
    end

    it "rejects unsupported cover types" do
      course.cover_type = "iframe"
      expect(course).not_to be_valid
      expect(course.errors[:cover_type]).to be_present
    end
  end

  describe "scopes" do
    it "returns only published courses" do
      published = Course.create!(title: "Published", description: "desc", published: true, user: create(:user), category: "test")
      unpublished = Course.create!(title: "Unpublished", description: "desc", published: false, user: create(:user), category: "test")
      expect(Course.published).to include(published)
      expect(Course.published).not_to include(unpublished)
    end
  end

  describe "#enrolled?" do
    it "returns true if the user is enrolled" do
      user = create(:user)
      course = Course.create!(title: "Test", description: "desc", user: user, category: "test")
      enrollment = course.course_enrollments.create!(user: user)
      expect(course.enrolled?(user)).to be true
    end

    it "returns false if the user is not enrolled" do
      user = create(:user)
      course = Course.create!(title: "Test", description: "desc", user: user, category: "test")
      other_user = create(:user)
      expect(course.enrolled?(other_user)).to be false
    end
  end

  describe "friendly_id" do
    it "generates a slug from the title" do
      course = Course.create!(title: "Ruby 101", description: "desc", user: create(:user), category: "test")
      expect(course.slug).to eq("ruby-101")
    end
  end

  describe "callbacks" do
    it "creates a course_product after create" do
      user = create(:user)
      course = Course.create!(title: "With Product", description: "desc", user: user, product_price: 10, category: "test")
      expect(course.course_product).to be_present
      expect(course.course_product.title).to eq("With Product")
    end

    it "updates course_product after update" do
      user = create(:user)
      course = Course.create!(title: "Initial", description: "desc", user: user, product_price: 10, category: "test")
      course.update!(title: "Updated")
      expect(course.course_product.title).to eq("Updated")
    end
  end
end
