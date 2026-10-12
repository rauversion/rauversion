class Users::OauthController < ApplicationController
  protect_from_forgery with: :exception
  before_action :validate_provider

  def create
    return_to = safe_sign_in_return_path(params[:return_to]) ||
      safe_sign_in_return_path(stored_location_for(:user)) || root_path
    context = tenant_oauth.start(provider: params[:provider], tenant: Current.tenant, return_to: return_to)

    redirect_to tenant_oauth.url_for(user_oauth_path(params[:provider], tenant_oauth_context: context)),
      allow_other_host: true, status: :see_other
  end

  def show
    return head :bad_request unless tenant_oauth.base_request?

    context = tenant_oauth.verify(params[:tenant_oauth_context], provider: params[:provider])
    return head :bad_request unless context

    @oauth_tenant = Tenant.find(context.fetch("tenant_id"))

    tenant_oauth.bind(params[:tenant_oauth_context])
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "same-origin"
    render layout: false
  end

  private

  def tenant_oauth
    @tenant_oauth ||= TenantOauth.new(request, session)
  end

  def validate_provider
    head :not_found unless User.omniauth_providers.map(&:to_s).include?(params[:provider])
  end
end
