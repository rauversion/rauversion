class Users::InvitationsController < Devise::InvitationsController

  skip_before_action :verify_authenticity_token, only: [ :update ]

  def update
    super do |resource|
      if request.format == 'json'
        if resource.errors.empty?
          return respond_with_navigational(resource, status: :success) {
             render json: resource, success: true
          }
        else
          return respond_with_navigational(resource)
        end
      end
    end
  end
end
