class Release < ApplicationRecord
  include FriendlyId
  belongs_to :playlist
  has_many :release_sections, dependent: :destroy
  has_many :release_playlists, dependent: :destroy
  has_many :playlists, through: :release_playlists
  belongs_to :product, optional: true
  friendly_id :title, use: :slugged

  TEMPLATES = ['base', 'react_app', 'red']

  has_one_attached :cover
  has_one_attached :sleeve

  accepts_nested_attributes_for :release_sections, allow_destroy: true
  accepts_nested_attributes_for :release_playlists, allow_destroy: true, reject_if: :all_blank

  store_attribute :config, :template, :string, default: :base
  store_attribute :config, :subtitle, :string
  store_attribute :config, :cover_color, :string
  store_attribute :config, :record_color, :string
  store_attribute :config, :sleeve_color, :string

  store_attribute :config, :spotify, :string
  store_attribute :config, :bandcamp, :string
  store_attribute :config, :soundcloud, :string

  validates :template, inclusion: { in: TEMPLATES }

end
