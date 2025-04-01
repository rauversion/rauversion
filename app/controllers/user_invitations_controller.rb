class UserInvitationsController < ApplicationController
  before_action :authenticate_user!

  def index
    @invitations = User.where(invited_by_id: current_user.id).page(params[:page]).per(10)
    respond_to do |format|
      format.json
    end
  end

  def create
    if current_user.has_invitations_left?
      user = User.invite!({username: Faker::Internet.username, email: params[:invitation][:email]}, current_user)
      if user.valid?
        current_user.decrement(:invitations_count)
        current_user.save
        
        @invitation = user
        respond_to do |format|
          format.json { render :create }
        end
      else
        respond_to do |format|
          format.json { 
            render json: { 
              error: user.errors.full_messages.join(", ")
            }, status: :unprocessable_entity 
          }
        end
      end
    else
      respond_to do |format|
        format.json { 
          render json: { 
            error: "No invitations left"
          }, status: :unprocessable_entity 
        }
      end
    end
  end
end
