module RequiresNewsletterAccess
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
    before_action :require_newsletter_access!
  end

  private

  def require_newsletter_access!
    return if current_user&.can_access_newsletter?

    respond_to do |format|
      format.html do
        redirect_to root_path, alert: "No tienes permiso para enviar newsletters"
      end
      format.json do
        render json: { errors: ["No tienes permiso para enviar newsletters"] }, status: :forbidden
      end
      format.any { head :forbidden }
    end
  end
end
