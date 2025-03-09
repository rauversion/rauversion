class MessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_conversation
  before_action :ensure_participant

  def create
    @message = @conversation.messages.build(message_params)
    @message.user = current_user
    @message.message_type = 'text'

    if @message.save
      # Broadcast the new message to all participants
      ConversationChannel.broadcast_to(
        @conversation,
        {
          type: 'new_message',
          message: {
            id: @message.id,
            body: @message.body,
            message_type: @message.message_type,
            created_at: @message.created_at,
            user: {
              id: @message.user.id,
              username: @message.user.username,
              full_name: [@message.user.first_name, @message.user.last_name].compact.join(' '),
              avatar_url: @message.user.avatar.attached? ? url_for(@message.user.avatar) : nil
            }
          }
        }
      )

      render :create, status: :created
    else
      render json: { errors: @message.errors }, status: :unprocessable_entity
    end
  end

  def index
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i

    @messages = @conversation.messages
                           .includes(:user, :message_reads)
                           .order(id: :asc)
                           .page(page)
                           .per(per_page)

    # Mark messages as read
    participant = @conversation.participants.find_by(user: current_user)
    @messages.each { |msg| msg.mark_as_read_by(participant) unless msg.user_id == current_user.id }
  end

  def mark_as_read
    participant = @conversation.participants.find_by(user: current_user)
    message = @conversation.messages.find(params[:id])
    
    message.mark_as_read_by(participant)
    render json: { success: true }
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
