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

  # Example method to call cropped_image with specific attributes
  def cropped_image(fallback: :horizontal)
    cropped_image_setup(attached_attribute: :cover, crop_data_attribute: :crop_data, fallback: fallback)
  end

  scope :published, -> {
    where(state: "published")
      .where(private: false)
  }

  scope :draft, -> { where(state: "draft") }

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


    url || "daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
  end

  def self.ransackable_attributes(auth_object = nil)
    ["body", "category_id", "created_at", "excerpt", "id", "id_value", "private", "settings", "slug", "state", "title", "updated_at", "user_id"]
  end
  # Ex:- scope :active, -> {where(:active => true)}
end
