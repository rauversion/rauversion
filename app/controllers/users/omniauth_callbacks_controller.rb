# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
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
    super
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

  def callback_handler
    auth = request.env["omniauth.auth"]
    # logger.info(request.env['omniauth.auth'].to_json)
    provider = auth["provider"]
    # logger.info("#{provider}, #{auth['uid']}, #{current_user.to_json}")
    user = User.find_by_identity_for(provider, auth, current_user)

    if user.present?
      flash.now[:notice] = "We are synchronizing your #{provider} data, it may take a while"
      redirect_to user_setting_path(user.username, :integrations) if user_signed_in?
      unless user_signed_in?
        sign_in(:user, user)
        redirect_to root_url and return
      end

    else
      session["devise.omniauth_data"] = auth.except("extra")
      redirect_to(new_user_registration_url)
    end
  end
end
