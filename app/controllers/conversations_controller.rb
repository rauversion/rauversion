class ConversationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_conversation, only: [:show, :update, :archived, :close]

  def index
    @conversations = current_user.conversations
                               .includes(:messages, participants: :user)
                               .order(updated_at: :desc)
  end

  def show
    if @conversation.participant?(current_user)
      # Eager load messages and participants for the conversation
      @conversation = Conversation.includes(
        messages: :user,
        participants: :user
      ).find(@conversation.id)
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def create
    @conversation = Conversation.new(conversation_params)
    @conversation.status = 'active'

    if @conversation.save
      # Add the creator as owner
      @conversation.add_participant(current_user, 'owner')
      
      # Add other participants if provided
      if params[:participant_ids].present?
        User.where(id: params[:participant_ids]).find_each do |user|
          @conversation.add_participant(user, 'member')
        end
      end

      # Broadcast to all participants
      @conversation.participants.each do |participant|
        NotificationsChannel.broadcast_to(
          participant.user,
          {
            type: 'new_conversation',
            conversation: {
              id: @conversation.id,
              subject: @conversation.subject,
              status: @conversation.status,
              messageable_type: @conversation.messageable_type,
              messageable_id: @conversation.messageable_id,
              created_at: @conversation.created_at,
              updated_at: @conversation.updated_at,
              participants: @conversation.participants.map { |p|
                {
                  id: p.id,
                  role: p.role,
                  user: {
                    id: p.user.id,
                    username: p.user.username,
                    full_name: [p.user.first_name, p.user.last_name].compact.join(' '),
                    avatar_url: p.user.avatar.attached? ? url_for(p.user.avatar) : nil
                  }
                }
              }
            }
          }
        )
      end

      render :show, status: :created
    else
      render json: { errors: @conversation.errors }, status: :unprocessable_entity
    end
  end

  def archived
    participant = @conversation.participants.find_by(user: current_user)
    
    if participant&.can_manage?
      @conversation.update(status: 'archived')

      # Broadcast status change to all participants
      broadcast_status_change('archived')

      render :show
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def close
    participant = @conversation.participants.find_by(user: current_user)
    
    if participant&.can_manage?
      @conversation.update(status: 'closed')

      # Broadcast status change to all participants
      broadcast_status_change('closed')

      render :show
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

  def broadcast_status_change(status)
    @conversation.participants.each do |participant|
      NotificationsChannel.broadcast_to(
        participant.user,
        {
          type: 'conversation_status_changed',
          conversation_id: @conversation.id,
          status: status
        }
      )
    end
  end
end
