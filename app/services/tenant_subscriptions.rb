module TenantSubscriptions
  def self.disabled?
    default = Rails.env.development? || Rails.env.test?

    ActiveModel::Type::Boolean.new.cast(
      ENV.fetch("DISABLE_TENANT_SUBSCRIPTION", default.to_s)
    )
  end
end
