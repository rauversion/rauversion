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

  describe "enrollment settings" do
    it "saves paid enrollment and returns the same price used by the course product" do
      patch "/courses/#{course.id}.json", params: { course: { enrollment_type: "paid", price: "25.50", published: true } }
      expect(response).to have_http_status(:ok)
      expect(course.reload).to be_paid_enrollment
      expect(course.course_product.price).to eq(course.price)
      expect(response.parsed_body.dig("course", "price")).to eq("25.5")
      expect(response.parsed_body.dig("course", "course_product", "price")).to eq(25.5)
    end

    it "changes a paid course to free enrollment and updates its product price" do
      course.update!(enrollment_type: "paid", price: 20)
      patch "/courses/#{course.id}.json", params: { course: { enrollment_type: "free", price: "0" } }
      expect(response).to have_http_status(:ok)
      expect(course.reload.price).to eq(0)
      expect(course.course_product.price).to eq(0)
    end

    it "rejects a paid course with no price and a public course with a price" do
      [{ enrollment_type: "paid", price: 0 }, { enrollment_type: "public", price: 20 }].each do |settings|
        patch "/courses/#{course.id}.json", params: { course: settings }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    it "preserves the saved price when only another setting changes" do
      course.update!(enrollment_type: "paid", price: 20)
      patch "/courses/#{course.id}.json", params: { course: { featured: true } }
      expect(response).to have_http_status(:ok)
      expect(course.reload.course_product.price).to eq(20)
    end
  end
end
