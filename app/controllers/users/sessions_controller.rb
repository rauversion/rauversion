# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  respond_to :html, :json

  after_action :set_csrf_headers, only: [:create, :destroy]

  def create
    self.resource = warden.authenticate!(auth_options)
    sign_in(resource_name, resource)
    
    respond_to do |format|
      format.html { respond_with resource, location: after_sign_in_path_for(resource) }
      format.json {
        render 'users/show'
      }
    end
  end

  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    
    respond_to do |format|
      format.html { 
        set_flash_message! :notice, :signed_out if signed_out
        respond_with resource, location: after_sign_out_path_for(resource_name)
      }
      format.json {
        render json: { success: true }
      }
    end
  end

  private
  def set_csrf_headers
    response.headers['X-CSRF-Param'] = request_forgery_protection_token.to_s
    response.headers['X-CSRF-Token'] = form_authenticity_token
  end
end
