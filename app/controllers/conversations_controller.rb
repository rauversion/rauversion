class ConversationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_conversation, only: [:show, :update, :archive, :close]

  def index
    @conversations = current_user.conversations
                               .includes(:messages, :participants)
                               .order(updated_at: :desc)

    respond_to do |format|
      format.html {
        render inline: "", layout: "react"
      }
      format.json {
        render 'index' #json: @conversations, include: [:participants]
      }
    end
  end

  def show
    if @conversation.participant?(current_user)
      render 'show' # json: @conversation, include: [:messages, :participants]
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def create
    @conversation = Conversation.new(conversation_params)
    @conversation.status = 'active'
    @conversation.messageable_id = current_user.id

    if @conversation.save
      # Add the creator as owner
      @conversation.add_participant(current_user, 'owner')
      
      # Add other participants if provided
      if params[:participant_ids].present?
        params[:participant_ids].each do |user_id|
          @conversation.add_participant(User.find(user_id), 'member')
        end
      end

      # Create initial system message
      @conversation.messages.create!(
        user: current_user,
        body: "Conversation started",
        message_type: 'system'
      )

      render "show" #json: @conversation, include: [:messages, :participants], status: :created
    else
      render json: { errors: @conversation.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @conversation.participants.where(user: current_user).first&.can_manage?
      if @conversation.update(conversation_params)
        render json: @conversation
      else
        render json: { errors: @conversation.errors }, status: :unprocessable_entity
      end
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def archive
    if @conversation.participants.where(user: current_user).first&.can_manage?
      @conversation.update(status: 'archived')
      render json: @conversation
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def close
    if @conversation.participants.where(user: current_user).first&.can_manage?
      @conversation.update(status: 'closed')
      render json: @conversation
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  private

  def set_conversation
    @conversation = Conversation.find(params[:id])
  end

  def conversation_params
    params.require(:conversation).permit(
      :subject,
      :messageable_type,
      :messageable_id
    )
  end
end
