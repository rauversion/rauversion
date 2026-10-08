require "rails_helper"

RSpec.describe "Server errors", type: :request do
  it "returns HTTP 500 for a JSON server error so clients do not treat it as successful data" do
    get "/500.json"

    expect(response).to have_http_status(:internal_server_error)
    expect(JSON.parse(response.body)).to eq("error" => "Internal Server Error", "status" => 500)
  end
end
