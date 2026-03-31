class MessageMailer < ApplicationMailer
  def new_message_notification
    @message = params[:message]
    @conversation = @message.conversation
    @recipient = params[:recipient]
    @sender = @message.user

    mail(
      to: @recipient.email,
      subject: t('notification_mailer.new_message.subject', sender: @sender.username)
    )
  end
end
