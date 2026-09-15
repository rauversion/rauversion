class Tenant < ApplicationRecord
  TEMPLATES = %w[amplifier editorial waveform broadcast].freeze
  HEADING_FONTS = %w[space_grotesk archivo_clash ibm_plex].freeze
  BRANDING_DEFAULTS = {
    template: "amplifier",
    primary_color: "#34d399",
    accent_color: "#22d3ee",
    background_color: "#09090b",
    heading_font: "space_grotesk"
  }.freeze
  COLOR_FORMAT = /\A#[0-9a-fA-F]{6}\z/
  THEME_COLOR_TOKENS = %w[
    background foreground card card-foreground popover popover-foreground
    primary primary-foreground secondary secondary-foreground muted muted-foreground
    accent accent-foreground destructive destructive-foreground success success-foreground border input ring
    chart-1 chart-2 chart-3 chart-4 chart-5 sidebar sidebar-foreground
    sidebar-primary sidebar-primary-foreground sidebar-accent sidebar-accent-foreground
    sidebar-border sidebar-ring
  ].freeze
  THEME_BASE_TOKENS = %w[radius font-sans font-heading].freeze
  THEME_COLOR_VALUE_FORMAT = /\A(?:#[0-9a-fA-F]{3,8}|(?:oklch|hsl|hsla|rgb|rgba)\([^;{}]+\)|transparent|currentColor)\z/
  THEME_RADIUS_VALUE_FORMAT = /\A\d+(?:\.\d+)?(?:rem|px)\z/
  THEME_FONT_VALUE_FORMAT = /\A(?:[\w\s,'"-]+|var\(--[a-z0-9-]+\))\z/

  THEME_PRESETS = TEMPLATES.index_with do |template|
    path = Rails.root.join("app/javascript/themes/tenant/#{template}.json")
    JSON.parse(File.read(path)).freeze
  end.freeze
  DEFAULT_THEME_SCHEMA = THEME_PRESETS.fetch("amplifier")

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
  BRANDING_DEFAULTS.each do |attribute, default|
    store_attribute :settings, attribute, :string, default: default
  end
  store_attribute :settings, :theme_schema, :json, default: -> { DEFAULT_THEME_SCHEMA.deep_dup }

  normalizes :slug, with: ->(slug) { normalize_slug(slug) }
  before_validation :apply_branding_defaults

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
  validate :theme_schema_must_be_safe

  def self.central
    find_by!(central: true)
  end

  def self.normalize_slug(value)
    value
      .to_s
      .encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "")
      .parameterize
  end

  def self.theme_preset(template)
    THEME_PRESETS.fetch(template.to_s).deep_dup
  end

  private

  def apply_branding_defaults
    BRANDING_DEFAULTS.each do |attribute, default|
      public_send("#{attribute}=", default) if public_send(attribute).blank?
    end
  end

  def theme_schema_must_be_safe
    schema = theme_schema
    unless schema.is_a?(Hash)
      errors.add(:theme_schema, "must be a JSON object")
      return
    end

    errors.add(:theme_schema, "must be a registry:theme") unless schema["type"] == "registry:theme"
    errors.add(:theme_schema, "must include a valid name") unless schema["name"].is_a?(String) && schema["name"].match?(/\A[a-z0-9-]{1,80}\z/)

    css_vars = schema["cssVars"]
    unless css_vars.is_a?(Hash)
      errors.add(:theme_schema, "must include cssVars")
      return
    end

    validate_theme_token_group(css_vars["theme"], THEME_BASE_TOKENS, :base, required: false)
    validate_theme_token_group(css_vars["light"], THEME_COLOR_TOKENS, :color, required: true)
    validate_theme_token_group(css_vars["dark"], THEME_COLOR_TOKENS, :color, required: true)
  end

  def validate_theme_token_group(values, allowed_tokens, value_type, required:)
    return if values.nil? && !required

    unless values.is_a?(Hash)
      errors.add(:theme_schema, "must include #{value_type == :base ? 'theme' : value_type} variables")
      return
    end

    unknown_tokens = values.keys.map(&:to_s) - allowed_tokens
    errors.add(:theme_schema, "contains unsupported tokens: #{unknown_tokens.join(', ')}") if unknown_tokens.any?

    values.each do |token, value|
      next if valid_theme_token_value?(token.to_s, value, value_type)

      errors.add(:theme_schema, "contains an invalid value for #{token}")
    end
  end

  def valid_theme_token_value?(token, value, value_type)
    return false unless value.is_a?(String) && value.length <= 120
    return value.match?(THEME_COLOR_VALUE_FORMAT) if value_type == :color
    return value.match?(THEME_RADIUS_VALUE_FORMAT) if token == "radius"

    value.match?(THEME_FONT_VALUE_FORMAT)
  end
end
