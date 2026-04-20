module Newsletter
  class BroadcastDeliveryJob < ApplicationJob
    include Notifiable

    queue_as :default

    def perform(broadcast_id)
      broadcast = Newsletter::Broadcast.includes(:user, :recipients).find(broadcast_id)
      return unless %w[queued sending].include?(broadcast.status)

      broadcast.update!(
        status: "sending",
        started_at: broadcast.started_at || Time.current,
        completed_at: nil,
        failed_at: nil,
        last_error: nil,
      )

      broadcast.recipients.where(status: "pending").order(:position).find_each do |recipient|
        deliver_to_recipient!(broadcast, recipient)
      end

      finalize_broadcast!(broadcast)
    rescue StandardError => e
      Rails.logger.error("Newsletter broadcast #{broadcast_id} failed: #{e.class} - #{e.message}")

      if broadcast.present?
        broadcast.update!(
          status: "failed",
          failed_at: Time.current,
          last_error: e.message.to_s,
        )

        broadcast_notification(
          broadcast.user_id,
          {
            type: "error",
            title: "Newsletter",
            message: "Falló el envío de #{broadcast.name}. #{e.message}",
          }
        )
      end

      raise
    end

    private

    def deliver_to_recipient!(broadcast, recipient)
      variables = Newsletter::TemplateVariables.build_map(
        sender: broadcast.user,
        recipient: recipient,
      )

      subject = Newsletter::TemplateVariables.resolve(broadcast.subject_template.to_s, variables)
      resolved_html = Newsletter::TemplateVariables.resolve(
        broadcast.html_template.to_s,
        variables,
        escape_html_values: true
      )
      html = Newsletter::BroadcastTracking.prepare_html(
        recipient: recipient,
        html: resolved_html
      )
      text = ActionController::Base.helpers.strip_tags(resolved_html.to_s)

      NewsletterBroadcastMailer.with(
        to_email: recipient.email,
        subject: subject,
        html: html,
        text: text
      ).broadcast_email.deliver_now

      recipient.update!(
        status: "sent",
        sent_at: Time.current,
        failed_at: nil,
        error_message: nil,
      )

      broadcast.increment!(:sent_recipients)
    rescue StandardError => e
      recipient.update!(
        status: "failed",
        failed_at: Time.current,
        error_message: e.message.to_s,
      )
      broadcast.increment!(:failed_recipients)
      Rails.logger.error("Newsletter delivery failed for broadcast #{broadcast.id} recipient #{recipient.email}: #{e.class} - #{e.message}")
    end

    def finalize_broadcast!(broadcast)
      broadcast.reload

      status =
        if broadcast.sent_recipients.zero? && broadcast.failed_recipients.positive?
          "failed"
        elsif broadcast.failed_recipients.positive?
          "completed_with_errors"
        else
          "completed"
        end

      broadcast.update!(
        status: status,
        completed_at: Time.current,
        failed_at: status == "failed" ? Time.current : nil,
        last_error: status == "failed" ? "No se pudo entregar ningún correo" : nil,
      )

      broadcast_notification(
        broadcast.user_id,
        {
          type: status == "failed" ? "error" : "success",
          title: "Newsletter",
          message: completion_message_for(broadcast, status),
        }
      )
    end

    def completion_message_for(broadcast, status)
      case status
      when "completed"
        "#{broadcast.name} se envió a #{broadcast.sent_recipients} destinatarios."
      when "completed_with_errors"
        "#{broadcast.name} terminó con #{broadcast.sent_recipients} enviados y #{broadcast.failed_recipients} errores."
      else
        "#{broadcast.name} no se pudo enviar."
      end
    end
  end
end
