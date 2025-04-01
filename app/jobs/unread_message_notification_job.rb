class UnreadMessageNotificationJob < ApplicationJob
  queue_as :default

  def perform(message_id)
    message = Message.find_by(id: message_id)
    return unless message

    # Get all participants except the sender
    recipients = message.conversation.participants.where.not(user_id: message.user_id)

    recipients.each do |recipient|
      # Skip if message is already read by this participant
      next if message.read_by?(recipient)

      # Send email notification
      MessageMailer.with(
        message: message,
        recipient: recipient.user
      ).new_message_notification.deliver_now
    end
  end
end
