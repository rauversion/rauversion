class Post < ApplicationRecord
  include Croppable
  extend FriendlyId
  friendly_id :title, use: :slugged
  has_one_attached :cover
  belongs_to :user
  belongs_to :category, optional: true
  has_one_attached :cover
  has_many :comments, as: :commentable

  store_accessor :settings, :crop_data, :json, default: {}
  store_accessor :settings, :reading_time
  # store_accessor :settings, :tags, :json, default: []

  # Example method to call cropped_image with specific attributes
  def cropped_image(fallback: :horizontal)
    cropped_image_setup(attached_attribute: :cover, crop_data_attribute: :crop_data, fallback: fallback)
  end

  scope :published, -> {
    where(state: "published")
      .where(private: false)
  }

  scope :draft, -> { where(state: "draft") }
  scope :latests, -> { order("created_at desc") }

  def tags=(list)
    self[:tags] = list.map(&:downcase).reject { |item| item.empty? }
  end
  
  def cover_url(size = nil)
    url = case size
    when :medium
      cover.variant(resize_to_limit: [200, 200])
      
    when :large
      cover.variant(resize_to_limit: [500, 500])

    when :small
       cover.variant(resize_to_limit: [50, 50])

    when :horizontal
      cover.variant(resize_to_limit: [600, 300])
    else
      cover.variant(resize_to_limit: [200, 200])
    end

    return Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?


    url || "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
  end

  def self.ransackable_attributes(auth_object = nil)
    ["body", "category_id", "created_at", "excerpt", "id", "id_value", "private", "settings", "slug", "state", "title", "updated_at", "user_id"]
  end

  def categorize
    prompt = <<~PROMPT
      You are an AI assistant tasked with categorizing magazine posts and generating tags. 
      Given the following post details, classify the post into one of the following categories:
      #{Category.all.map(&:name).join("\n - ")}

      Also, generate a list of relevant tags based on the content.

      Post Details:
      Title: #{title}
      Excerpt: #{excerpt}
      Body: #{plain_text}

      Respond in the following JSON format:
      {
        "category": "Selected category from the list",
        "tags": ["tag1", "tag2", "tag3", ...]
      }
    PROMPT

    @client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"], log_errors: true)

 
    response = @client.chat(
      parameters: {
          model: "gpt-4o",
          messages: [
            { role: "assistant", content: prompt }
          ],
          temperature: 0.7,
      })

    json = response.dig('choices', 0, "message", "content").gsub("```json", "").gsub("```", "")
    result = JSON.parse(json)

    if result && result.key?("category") && result.key?("tags")
      category = Category.find_by(name: result["category"])
      update(category_id: category.id) if category
      update(tags: result["tags"])
    end
  rescue JSON::ParserError
    { "error": "Failed to parse response from OpenAI" }
  end

  def plain_text
    Dante::Utils.extract_plain_text(body["content"])
  end
end
