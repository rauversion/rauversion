class Tenant < ApplicationRecord
  TEMPLATES = %w[amplifier editorial waveform].freeze
  HEADING_FONTS = %w[space_grotesk archivo_clash ibm_plex].freeze
  COLOR_FORMAT = /\A#[0-9a-fA-F]{6}\z/

  RESERVED_SLUGS = %w[
    admin api app assets backstage billing domains help mail newsletter
    secure settings status support www
  ].freeze

  has_many :memberships, dependent: :restrict_with_exception
  has_many :users, through: :memberships
  has_many :tenant_profiles, dependent: :restrict_with_exception
  has_many :tracks, dependent: :restrict_with_exception
  has_many :playlists, dependent: :restrict_with_exception
  has_many :events, dependent: :restrict_with_exception
  has_many :products, dependent: :restrict_with_exception
  has_many :posts, dependent: :restrict_with_exception
  has_many :courses, dependent: :restrict_with_exception
  has_many :releases, dependent: :restrict_with_exception
  has_one_attached :logo
  has_one :tenant_subscription, dependent: :restrict_with_exception

  def access_policy
    TenantAccessPolicy.new(self)
  end

  def entitled?(key)
    access_policy.entitled?(key)
  end

  store_attribute :settings, :tagline, :string
  store_attribute :settings, :template, :string, default: "amplifier"
  store_attribute :settings, :primary_color, :string, default: "#34d399"
  store_attribute :settings, :accent_color, :string, default: "#22d3ee"
  store_attribute :settings, :background_color, :string, default: "#09090b"
  store_attribute :settings, :heading_font, :string, default: "space_grotesk"

  normalizes :slug, with: ->(slug) { normalize_slug(slug) }

  validates :name, presence: true, length: { maximum: 80 }
  validates :slug,
    presence: true,
    uniqueness: true,
    length: { minimum: 3, maximum: 63 },
    exclusion: { in: RESERVED_SLUGS, message: "is reserved" },
    format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }
  validates :template, inclusion: { in: TEMPLATES }
  validates :heading_font, inclusion: { in: HEADING_FONTS }
  validates :primary_color, :accent_color, :background_color, format: { with: COLOR_FORMAT }
  validates :tagline, length: { maximum: 160 }, allow_blank: true

  def self.central
    find_by!(central: true)
  end

  def self.normalize_slug(value)
    value
      .to_s
      .encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "")
      .parameterize
  end
end
