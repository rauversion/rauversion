class Tenant < ApplicationRecord
  RESERVED_SLUGS = %w[
    admin api app assets backstage billing domains help mail newsletter
    secure settings status support www
  ].freeze

  has_many :memberships, dependent: :restrict_with_exception
  has_many :users, through: :memberships

  normalizes :slug, with: ->(slug) { normalize_slug(slug) }

  validates :name, presence: true, length: { maximum: 80 }
  validates :slug,
    presence: true,
    uniqueness: true,
    length: { minimum: 3, maximum: 63 },
    exclusion: { in: RESERVED_SLUGS, message: "is reserved" },
    format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }

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
