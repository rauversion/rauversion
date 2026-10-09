require "rails_helper"

RSpec.describe "Store listings", type: :request do
  {
    "/store" => {},
    "/store/music" => { type: "Products::MusicProduct", category: "vinyl", condition: "new", allow_pickup: true },
    "/store/gear" => { type: "Products::GearProduct", category: "instrument", condition: "new", brand: "Roland", model: "TR-8", year: 2020, allow_pickup: true },
    "/store/accessories" => { type: "Products::AccessoryProduct", category: "accessories", allow_pickup: true },
    "/store/merch" => { type: "Products::MerchProduct", category: "merch", allow_pickup: true },
    "/store/services" => { type: "Products::ServiceProduct", category: "coaching", service_kind: "advisory" },
    "/store/performers" => { type: "Products::ServiceProduct", category: "dj_set", service_kind: "performance" },
    "/store/classes" => { type: "Products::ServiceProduct", category: "classes", service_kind: "education" },
    "/store/feedback" => { type: "Products::ServiceProduct", category: "feedback", service_kind: "advisory" }
  }.each do |path, attributes|
    it "orders #{path} from newest to oldest, breaking date ties by descending ID" do
      factory = attributes[:type] == "Products::ServiceProduct" ? :service_product : :product
      seller = create(:user)
      old = create(factory, **attributes, user: seller, title: "Old", sku: "old", created_at: 2.days.ago)
      first = create(factory, **attributes, user: seller, title: "First", sku: "first", created_at: 1.day.ago.change(usec: 0))
      last = create(factory, **attributes, user: seller, title: "Last", sku: "last", created_at: first.created_at)

      get "#{path}.json"

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).fetch("collection").map { |product| product.fetch("id") })
        .to eq([last.id, first.id, old.id])
    end
  end

  it "keeps descending order across pages when filtering a category" do
    seller = create(:user)
    products = Array.new(13) do |index|
      create(:service_product, user: seller, title: "Coaching #{index}", created_at: index.hours.ago)
    end
    create(:service_product, user: seller, category: "feedback", title: "Feedback")

    get "/store/services.json", params: { subcategory: "coaching" }
    payload = JSON.parse(response.body)
    expect(payload.fetch("collection").map { |product| product.fetch("id") }).to eq(products.first(12).map(&:id))
    expect(payload.fetch("metadata").fetch("category_counts")).to include("coaching" => 13, "feedback" => 1, "all" => 14)

    get "/store/services.json", params: { subcategory: "coaching", page: 2 }
    expect(JSON.parse(response.body).fetch("collection").map { |product| product.fetch("id") }).to eq([products.last.id])
  end
end
