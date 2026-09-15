class TenantAccessPolicy
  attr_reader :tenant

  def initialize(tenant)
    @tenant = tenant
  end

  def accessible?
    tenant.central? || TenantSubscriptions.disabled? || !!subscription&.allows_access?
  end

  def entitled?(key)
    return true if tenant.central? || TenantSubscriptions.disabled?

    ActiveModel::Type::Boolean.new.cast(entitlement(key))
  end

  def limit(key)
    return nil if tenant.central? || TenantSubscriptions.disabled?

    value = entitlement(key)
    value.nil? ? nil : value.to_i
  end

  def within_limit?(key, current_value)
    maximum = limit(key)
    maximum.nil? || current_value.to_i < maximum
  end

  private

  def subscription
    @subscription ||= tenant.tenant_subscription
  end

  def entitlement(key)
    subscription&.entitlement(key)
  end
end
