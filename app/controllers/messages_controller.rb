class MessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_conversation
  before_action :ensure_participant

  def create
    @message = @conversation.messages.build(message_params)
    @message.user = current_user
    @message.message_type = 'text'

    if @message.save
      render 'create' # json: @message, status: :created
    else
      render json: { errors: @message.errors }, status: :unprocessable_entity
    end
  end

  def index
    @messages = @conversation.messages
    .includes(:user).ordered
    .page(params[:page]).per(20)
    render 'index' #json: @messages, include: [:user]
  end

  private

  def set_conversation
    @conversation = Conversation.find(params[:conversation_id])
  end

  def ensure_participant
    unless @conversation.participant?(current_user)
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def message_params
    params.require(:message).permit(:body)
  end
end
