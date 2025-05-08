require 'rails_helper'

RSpec.describe "CourseModules", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/course_modules/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/course_modules/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /destroy" do
    it "returns http success" do
      get "/course_modules/destroy"
      expect(response).to have_http_status(:success)
    end
  end

end
