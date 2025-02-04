# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]
  before_action :configure_account_update_params, only: [:update]

  invisible_captcha only: [:create, :update], on_spam: :spam_callback_method

  # GET /resource/sign_up
  # def new
  #   super
  # end

  def new
    build_resource(sign_up_params)
    
    # Check if we have OmniAuth data in the session
    if session["devise.omniauth_data"]
      # Prefill email from OmniAuth data
      resource.email = session["devise.omniauth_data"]["info"]["email"]
      resource.username = resource.email.split("@").first.parameterize
    end

    yield resource if block_given?
    respond_with resource
  end

  respond_to :html, :json

  def create
    build_resource(sign_up_params)

    if session["devise.omniauth_data"]
      resource.email = session["devise.omniauth_data"]["info"]["email"] if resource.email.blank?
    end
    
    resource.save
    yield resource if block_given?
    
    if resource.persisted?
      if session["devise.omniauth_data"]
        create_oauth_credential_and_identity(resource)
      end
      
      if resource.active_for_authentication?
        set_flash_message! :notice, :signed_up if is_flashing_format?
        sign_up(resource_name, resource)
        respond_to do |format|
          format.html { respond_with resource, location: after_sign_up_path_for(resource) }
          format.json { render 'users/show' }
        end
      else
        set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}" if is_flashing_format?
        expire_data_after_sign_in!
        respond_to do |format|
          format.html { respond_with resource, location: after_inactive_sign_up_path_for(resource) }
          format.json { render json: { error: resource.inactive_message }, status: :unprocessable_entity }
        end
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      respond_to do |format|
        format.html { respond_with resource }
        format.json { render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def update
    self.resource = resource_class.to_adapter.get!(send(:"current_#{resource_name}").to_key)
    prev_unconfirmed_email = resource.unconfirmed_email if resource.respond_to?(:unconfirmed_email)

    resource_updated = update_resource(resource, account_update_params)
    yield resource if block_given?
    if resource_updated
      set_flash_message_for_update(resource, prev_unconfirmed_email)
      bypass_sign_in resource, scope: resource_name if sign_in_after_change_password?

      respond_to do |format|
        format.html { respond_with resource, location: after_update_path_for(resource) }
        format.json { render 'users/show' }
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      respond_to do |format|
        format.html { respond_with resource }
        format.json { render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  # GET /resource/edit
  # def edit
  #   super
  # end

  # PUT /resource
  # def update
  #   super
  # end

  # DELETE /resource
  # def destroy
  #   super
  # end

  # GET /resource/cancel
  # Forces the session data which is usually expired after sign
  # in to be expired now. This is useful if the user wants to
  # cancel oauth signing in/up in the middle of the process,
  # removing all OAuth session data.
  # def cancel
  #   super
  # end

  # protected

  # If you have extra params to permit, append them to the sanitizer.
  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username])
  end

  # If you have extra params to permit, append them to the sanitizer.
  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [:username])
  end

  def create_oauth_credential_and_identity(user)
    auth = session["devise.omniauth_data"]
    provider = auth["provider"]
    uid = auth["uid"]

    user.identities.create!(provider: provider,
    uid: uid,
    token: auth["credentials"]["token"],
    secret: auth["credentials"]["secret"])

    # Clear the session data
    session["devise.omniauth_data"] = nil
  end

  # The path used after sign up.
  # def after_sign_up_path_for(resource)
  #   super(resource)
  # end

  # The path used after sign up for inactive accounts.
  # def after_inactive_sign_up_path_for(resource)
  #   super(resource)
  # end

  private

  def spam_callback_method
    redirect_to root_path
  end
end
