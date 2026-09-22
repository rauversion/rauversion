class TenantProfile < ApplicationRecord
  belongs_to :tenant
  belongs_to :user

  normalizes :username, with: ->(username) { Tenant.normalize_slug(username) }

  validates :user_id, uniqueness: { scope: :tenant_id }
  validates :username,
    uniqueness: { scope: :tenant_id },
    length: { minimum: 3, maximum: 63 },
    format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ },
    allow_blank: true

  scope :for_tenant, ->(tenant = Current.tenant) { tenant.present? ? where(tenant_id: tenant.id) : none }

  def self.create_for_membership!(membership)
    # Serialize repairs against the existing membership so concurrent requests
    # cannot create duplicate profiles or overwrite tenant-specific data.
    membership.with_lock do
      find_or_create_by!(tenant: membership.tenant, user: membership.user) do |profile|
        profile.assign_attributes(
          username: membership.user.username,
          display_name: membership.user.display_name,
          first_name: membership.user.first_name,
          last_name: membership.user.last_name,
          country: membership.user.country,
          city: membership.user.city,
          bio: membership.user.bio
        )
      end
    end
  end
end
