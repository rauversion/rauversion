# app/models/product.rb
class Product < ApplicationRecord
  extend FriendlyId
  friendly_id :title, use: :slugged
  acts_as_paranoid

  belongs_to :user
  belongs_to :album, class_name: 'Playlist', optional: true, foreign_key: :playlist_id
  belongs_to :coupon, optional: true

  has_many :product_variants, dependent: :destroy
  has_many :product_options, dependent: :destroy
  has_many :product_images
  has_many :purchased_items, as: :purchased_item
  has_many :product_shippings, dependent: :destroy
  has_many :product_purchase_items
  has_many :product_purchases, through: :product_purchase_items

  validates :title, presence: true
  validates :description, presence: true
  # validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  # validates :stock_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  # validates :sku, presence: true, uniqueness: true
  validates :category, presence: true
  validates :status, presence: true

  attribute :visibility, :string
  attribute :name_your_price, :boolean
  attribute :quantity, :integer

  enum :status, { active: 'active', inactive: 'inactive', sold_out: 'sold_out' }
  enum :category, { 
    merch: 'merch', 
    vinyl: 'vinyl', 
    cassette: 'cassette', 
    cd: 'cd', 
    other: 'other',
    instrument: 'instrument',
    audio_gear: 'audio_gear',
    dj_gear: 'dj_gear',
    accessories: 'accessories'
  }

  enum :condition, {
    new: 'new',
    like_new: 'like_new',
    excellent: 'excellent',
    very_good: 'very_good',
    good: 'good',
    fair: 'fair',
    poor: 'poor'
  }, prefix: true

  scope :active, -> { where(status: 'active') }
  scope :by_category, ->(category) { where(category: category) }

  accepts_nested_attributes_for :product_variants
  accepts_nested_attributes_for :product_options
  accepts_nested_attributes_for :product_images
  accepts_nested_attributes_for :product_shippings, allow_destroy: true, reject_if: :all_blank

  def edit_path(user)
    case type
    when "Products::MusicProduct"
      Rails.application.routes.url_helpers.edit_user_products_music_path(user.username, self)
    when "Products::GearProduct"
      Rails.application.routes.url_helpers.edit_user_products_gear_path(user.username, self)
    when "Products::MerchProduct"
      Rails.application.routes.url_helpers.edit_user_products_merch_path(user.username, self)
    when "Products::AccessoryProduct"
      Rails.application.routes.url_helpers.edit_user_products_accessory_path(user.username, self)
    when "Products::ServiceProduct"
      Rails.application.routes.url_helpers.edit_user_products_service_path(user.username, self)
    else
      Rails.application.routes.url_helpers.edit_user_product_path(user.username, self)
    end
  end

  def self.ransackable_attributes(auth_object = nil)
    ["category", "created_at", "description", "id", "id_value", "include_digital_album", 
     "limited_edition", "limited_edition_count", "name_your_price", "playlist_id", 
     "price", "quantity", "shipping_begins_on", "shipping_days", 
     "shipping_within_country_price", "shipping_worldwide_price", "sku", "status", 
     "stock_quantity", "title", "updated_at", "user_id", "visibility",
     "condition", "brand", "model", "year", "accept_barter"]
  end

  def main_image
    product_images.first
  end

  def available?
    active? && stock_quantity.to_i > 0
  end

  def decrease_quantity(amount)
    return unless amount.positive?
    
    with_lock do
      new_quantity = stock_quantity - amount
      if new_quantity >= 0
        update!(stock_quantity: new_quantity)
        update!(status: :sold_out) if new_quantity == 0
      else
        raise ActiveRecord::RecordInvalid.new(self)
      end
    end
  end
end