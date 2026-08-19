class Current < ActiveSupport::CurrentAttributes
  attribute :label_user, :user, :tenant, :membership, :tenant_profile
  attribute :request_id, :user_agent, :ip_address

  resets { Time.zone = nil }

  def user=(user)
    super
    #self.label_user = user.account
    #Time.zone    = user.time_zone
  end
end
