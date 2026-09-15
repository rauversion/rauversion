class Release < ApplicationRecord
  include FriendlyId
  belongs_to :tenant
  belongs_to :playlist, optional: true
  belongs_to :user, optional: true
  has_many :release_sections, dependent: :destroy
  has_many :release_playlists, dependent: :destroy
  has_many :playlists, through: :release_playlists
  belongs_to :product, optional: true
  friendly_id :title, use: :slugged
  before_validation -> { self.tenant ||= Current.tenant }, on: :create

  scope :for_tenant, ->(tenant = Current.tenant) { tenant.present? ? where(tenant_id: tenant.id) : none }

  validate :linked_resources_belong_to_tenant

  TEMPLATES = ['base', 'react_app', 'red', 'puck', 'default']

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

  store_attribute :editor_data, :theme_schema, :json
  store_attribute :editor_data, :pages, :json, default: []

  validates :template, inclusion: { in: TEMPLATES }

  def cover_url(size = :medium)
    url = case size
    when :medium
      cover.variant(resize_to_fill: [200, 200]) # &.processed&.url

    when :large
      cover.variant(resize_to_fill: [500, 500]) # &.processed&.url

    when :small
      cover.variant(resize_to_fill: [50, 50]) # &.processed&.url

    else
      cover.variant(resize_to_fill: [200, 200]) # &.processed&.url
    end

    return Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?

    AlbumsHelper.default_image_sqr
  end

  private

  def linked_resources_belong_to_tenant
    errors.add(:playlist, "must belong to the same tenant") if playlist.present? && playlist.tenant_id != tenant_id
    errors.add(:product, "must belong to the same tenant") if product.present? && product.tenant_id != tenant_id
  end
end
