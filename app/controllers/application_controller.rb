class ApplicationController < ActionController::Base
  before_action do
    ActiveStorage::Current.url_options = {protocol: request.protocol, host: request.host, port: request.port}
    # ActiveStorage::Current.url_options = { protocol: "http://", host: "localhost", port: "3000" }
    Current.label_user = User.find(session[:parent_user]) if session[:parent_user].present?
  end

  before_action :set_locale

  helper_method :flash_stream

  layout :layout_by_resource

  def flash_stream
    turbo_stream.replace("flash", partial: "shared/flash", locals: { flash: flash })
  end

  def layout_by_resource
    if request.headers["Turbo-Frame"] == "content" or request.headers["X-Turbo-Request-Id"].present?
      false
    else
      "react"
    end
  end

  helper_method :impersonating?
  def impersonating?(user)
    label_user.present? && current_user&.id == user&.id
  end

  def set_locale
    if params[:locale].present?
      cookies[:locale] = params[:locale]
      I18n.locale = params[:locale]
    elsif cookies[:locale].present?
      I18n.locale = cookies[:locale]
    else
      I18n.locale = ENV["DEFAULT_LOCALE"] || I18n.default_locale
    end
  end

  def guard_artist
    return if current_user.artist? or current_user.admin? or current_user.editor?
    redirect_to root_url
  end

  helper_method :label_user
  def label_user
    return if session[:parent_user].blank?
    @label_user ||= User.find session[:parent_user]
  end

  def become
    actor = label_user.presence || current_user

    unless actor&.is_admin?
      return redirect_to(root_url, alert: "not allowed")
    end

    user = User.find_by(username: params[:id])
    return redirect_to(root_url, alert: "user not found") if user.blank?
    return redirect_to(user_path(user.username)) if user.id == actor.id

    start_impersonation(actor: actor, user: user)
    redirect_to user_path(user.username), notice: "signed as #{user.username}"
  end

  def change_locale
    render status: :ok, json: { locale: params[:locale] }
  end

  def render_blank
    render inline: "", layout: "react"
  end

  def disable_footer
    @disable_footer = true
  end

  protected

  def start_impersonation(actor:, user:)
    session[:parent_user] ||= actor.id
    Current.label_user = actor
    sign_in(:user, user)
  end

  def stop_impersonation
    return if session[:parent_user].blank?

    user = User.find(session[:parent_user])
    session[:parent_user] = nil
    Current.label_user = nil
    sign_in(:user, user)
    user
  end
end
