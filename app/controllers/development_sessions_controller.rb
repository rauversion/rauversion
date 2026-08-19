class DevelopmentSessionsController < ApplicationController
  def create
    return head :not_found unless Rails.env.development?

    tenant = find_tenant!
    membership = find_membership!(tenant)

    sign_out(:user) if current_user.present?
    sign_in(:user, membership.user)
    session[:parent_user] = nil

    redirect_to tenant_admin_url(tenant),
      notice: "Signed in as #{membership.user.username} on #{tenant.name} (#{membership.role})"
  end

  private

  def find_tenant!
    identifier = params[:id].to_s

    if identifier.match?(/\A\d+\z/)
      Tenant.find(identifier)
    else
      Tenant.find_by!(slug: Tenant.normalize_slug(identifier))
    end
  end

  def find_membership!(tenant)
    return preferred_membership(tenant) if params[:user].blank?

    identifier = params[:user].to_s
    scope = tenant.memberships.joins(:user).includes(:user)

    if identifier.match?(/\A\d+\z/)
      scope.find_by!(user_id: identifier)
    else
      scope.find_by!(users: { username: identifier })
    end
  end

  def preferred_membership(tenant)
    memberships = tenant.memberships.includes(:user)

    memberships.find_by(role: "owner") ||
      memberships.find_by(role: "admin") ||
      memberships.first!
  end

  def tenant_admin_url(tenant)
    host = tenant.central? ? "lvh.me" : "#{tenant.slug}.lvh.me"
    "#{request.protocol}#{host}:#{request.port}/admin"
  end
end
