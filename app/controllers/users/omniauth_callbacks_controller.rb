# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  before_action :load_tenant_oauth_context
  # You should configure your model like this:
  # devise :omniauthable, omniauth_providers: [:twitter]

  # You should also create an action method in this controller like this:
  # def twitter
  # end

  # More info at:
  # https://github.com/heartcombo/devise#omniauth

  # GET|POST /resource/auth/twitter
  # def passthru
  #   super
  # end

  # GET|POST /users/auth/twitter/callback
  def failure
    return super unless @tenant_oauth_context

    relay_oauth(error: failure_message)
  end

  def complete
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "same-origin"
    result = tenant_oauth.receive(params[:handoff_token], provider: params[:provider])
    return head :bad_request unless result

    @tenant_oauth_context = result.fetch("context")
    tenant_oauth.finish
    if result["error"]
      set_flash_message! :alert, :failure,
        kind: OmniAuth::Utils.camelize(params[:provider]), reason: result["error"]
      path = new_user_session_path(return_to: @tenant_oauth_context["return_to"])
      return oauth_redirect_to(path)
    end

    request.env["omniauth.auth"] = OmniAuth::AuthHash.new(result.fetch("auth"))
    store_oauth_return_path
    callback_handler
  end

  # protected

  # The path used when OmniAuth fails
  # def after_omniauth_failure_path_for(scope)
  #   super(scope)
  # end

  prepend_before_action :require_no_authentication, only: [:new, :create]
  skip_before_action :verify_authenticity_token # , only: [:create]

  def passthru
    callback_handler
    # render :file => "#{Rails.root}/public/404.html", :status => 404, :layout => false
    # Or alternatively,
    # raise ActionController::RoutingError.new('Not Found')
  end

  def twitter
    logger.info("Callback Twitter")
    # logger.info(session.to_json)
    callback_handler
  end

  def instagram
    logger.info("Callback Instagram")
    # logger.info(session.to_json)
    callback_handler
  end

  def soundcloud
    logger.info("Callback SoundCloud")
    # logger.info(session.to_json)
    callback_handler
  end

  def zoom
    logger.info("Callback Zoom")
    # logger.info(session.to_json)
    callback_handler
  end

  def stripe_connect
    logger.info("Callback Stripe")
    # logger.info(session.to_json)
    callback_handler
  end

  def discord
    logger.info("Callback Discord")
    # logger.info(session.to_json)
    callback_handler
  end

  def twitch
    logger.info("Callback Twitch")
    # logger.info(session.to_json)
    callback_handler
  end

  def google_oauth2
    logger.info("Callback Google")
    # logger.info(session.to_json)
    callback_handler
  end

  def mercado_pago
    logger.info("Callback Mercado Pago")
    # logger.info(session.to_json)
    callback_handler
  end

  private

  def tenant_oauth
    @tenant_oauth ||= TenantOauth.new(request, session)
  end

  def load_tenant_oauth_context
    return if action_name == "complete"

    token = request.env["omniauth.params"]&.[]("tenant_oauth_context")
    return if token.blank?

    provider = request.env["omniauth.auth"]&.[]("provider") || failed_strategy&.name
    @tenant_oauth_context = tenant_oauth.verify(token, provider: provider.to_s)
    return head :bad_request unless @tenant_oauth_context && tenant_oauth.base_request? && tenant_oauth.bound?(token)
  end

  def store_oauth_return_path
    store_location_for(:user, safe_sign_in_return_path(@tenant_oauth_context["return_to"]))
  end

  def relay_oauth(auth: nil, error: nil)
    token = tenant_oauth.handoff(@tenant_oauth_context, auth: auth, error: error)
    tenant_oauth.finish_base
    path = complete_user_oauth_path(@tenant_oauth_context["provider"], handoff_token: token)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "same-origin"
    redirect_to tenant_oauth.return_url(path, @tenant_oauth_context), allow_other_host: true
  end

  def oauth_redirect_to(path)
    if @tenant_oauth_context
      tenant_oauth.finish
      redirect_to tenant_oauth.return_url(path, @tenant_oauth_context), allow_other_host: true
    else
      redirect_to path
    end
  end

  def callback_handler
    auth = request.env["omniauth.auth"]
    if @tenant_oauth_context && action_name != "complete"
      return relay_oauth(auth: auth)
    end
    # logger.info(request.env['omniauth.auth'].to_json)
    provider = auth["provider"]
    # logger.info("#{provider}, #{auth['uid']}, #{current_user.to_json}")
    user = User.find_by_identity_for(provider, auth, current_user)

    if user.present?
      flash.now[:notice] = "We are synchronizing your #{provider} data, it may take a while"
      oauth_redirect_to user_setting_path(user.username, :integrations) if user_signed_in?
      unless user_signed_in?
        sign_in(:user, user)
        oauth_redirect_to after_sign_in_path_for(user) and return
      end

    else
      session["devise.omniauth_data"] = auth.except("extra")
      oauth_redirect_to(new_user_registration_path)
    end
  end
end
