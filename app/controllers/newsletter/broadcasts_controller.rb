module Newsletter
  class BroadcastsController < ApplicationController
    before_action :authenticate_user!
    before_action :set_broadcast, only: [:show, :update, :destroy, :send_now]

    def index
      respond_to do |format|
        format.html { render_blank }
        format.json do
          render json: {
            broadcasts: current_user.newsletter_broadcasts
              .includes(:audience, :email_template)
              .order(updated_at: :desc)
              .map { |broadcast| serialize_broadcast(broadcast) },
          }
        end
      end
    end

    def show
      render json: {
        broadcast: serialize_broadcast(@broadcast, include_recipients: true),
      }
    end

    def create
      broadcast = current_user.newsletter_broadcasts.new(
        name: params.dig(:broadcast, :name).presence || "Nuevo broadcast",
        status: "draft",
      )

      if broadcast.save
        render json: { broadcast: serialize_broadcast(broadcast, include_recipients: true) }, status: :created
      else
        render json: { errors: broadcast.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      unless can_modify_broadcast?(@broadcast)
        render json: { errors: ["No puedes modificar un broadcast en progreso"] }, status: :unprocessable_entity
        return
      end

      if @broadcast.update(resolved_broadcast_attributes)
        render json: { broadcast: serialize_broadcast(@broadcast.reload, include_recipients: true) }
      else
        render json: { errors: @broadcast.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordNotFound
      render json: { errors: ["No pudimos encontrar la audiencia o el template seleccionado"] }, status: :unprocessable_entity
    end

    def destroy
      unless can_modify_broadcast?(@broadcast)
        render json: { errors: ["No puedes eliminar un broadcast en progreso"] }, status: :unprocessable_entity
        return
      end

      @broadcast.destroy
      head :no_content
    end

    def send_now
      if @broadcast.active_delivery?
        render json: { errors: ["Este broadcast ya está en proceso de envío"] }, status: :unprocessable_entity
        return
      end

      if send_now_params[:audience_id].blank? || send_now_params[:email_template_id].blank?
        render json: { errors: ["Selecciona una audiencia y un template antes de enviar"] }, status: :unprocessable_entity
        return
      end

      if send_now_params[:html_template].blank? || send_now_params[:subject_template].blank?
        render json: { errors: ["Faltan el subject o el HTML del correo"] }, status: :unprocessable_entity
        return
      end

      audience = current_user.newsletter_audiences.includes(:sources).find(send_now_params[:audience_id])
      email_template = current_user.email_templates.find(send_now_params[:email_template_id])
      preview = Newsletter::AudienceResolver.new(user: current_user, sources: audience.sources).resolve

      if preview[:recipients].empty?
        render json: { errors: ["La audiencia seleccionada no tiene destinatarios"] }, status: :unprocessable_entity
        return
      end

      ActiveRecord::Base.transaction do
        @broadcast.update!(
          name: send_now_params[:name].presence || @broadcast.name,
          audience: audience,
          email_template: email_template,
          subject_template: send_now_params[:subject_template],
          html_template: send_now_params[:html_template],
          status: "queued",
          total_recipients: preview[:unique_recipients_count],
          sent_recipients: 0,
          failed_recipients: 0,
          started_at: nil,
          completed_at: nil,
          failed_at: nil,
          last_error: nil,
        )

        @broadcast.recipients.delete_all
        insert_recipients!(@broadcast, preview[:recipients])
      end

      Newsletter::BroadcastDeliveryJob.perform_later(@broadcast.id)

      render json: {
        broadcast: serialize_broadcast(@broadcast.reload, include_recipients: true),
        preview: preview.except(:recipients),
      }
    rescue ActiveRecord::RecordNotFound
      render json: { errors: ["No pudimos encontrar la audiencia o el template seleccionado"] }, status: :unprocessable_entity
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    private

    def set_broadcast
      @broadcast = current_user.newsletter_broadcasts.includes(:audience, :email_template, :recipients).find(params[:id])
    end

    def broadcast_params
      params.require(:broadcast).permit(:name, :audience_id, :email_template_id)
    end

    def send_now_params
      params.require(:broadcast).permit(:name, :audience_id, :email_template_id, :subject_template, :html_template)
    end

    def insert_recipients!(broadcast, recipients)
      return if recipients.empty?

      timestamp = Time.current
      Newsletter::BroadcastRecipient.insert_all!(
        recipients.each_with_index.map do |recipient, index|
          {
            broadcast_id: broadcast.id,
            position: index,
            email: recipient[:email],
            name: recipient[:name],
            first_name: recipient[:first_name],
            last_name: recipient[:last_name],
            country: recipient[:country],
            username: recipient[:username],
            display_name: recipient[:display_name],
            event_titles: recipient[:event_titles] || [],
            ticket_titles: recipient[:ticket_titles] || [],
            source_labels: recipient[:source_labels] || [],
            source_types: recipient[:source_types] || [],
            status: "pending",
            created_at: timestamp,
            updated_at: timestamp,
          }
        end
      )
    end

    def can_modify_broadcast?(broadcast)
      !broadcast.active_delivery?
    end

    def resolved_broadcast_attributes
      attrs = { name: broadcast_params[:name] }

      attrs[:audience] =
        if broadcast_params.key?(:audience_id)
          broadcast_params[:audience_id].present? ? current_user.newsletter_audiences.find(broadcast_params[:audience_id]) : nil
        end

      attrs[:email_template] =
        if broadcast_params.key?(:email_template_id)
          broadcast_params[:email_template_id].present? ? current_user.email_templates.find(broadcast_params[:email_template_id]) : nil
        end

      attrs.compact
    end

    def serialize_broadcast(broadcast, include_recipients: false)
      serialized = {
        id: broadcast.id.to_s,
        name: broadcast.name,
        status: broadcast.status,
        audience_id: broadcast.audience_id&.to_s,
        audience_name: broadcast.audience&.name,
        email_template_id: broadcast.email_template_id&.to_s,
        email_template_name: broadcast.email_template&.name,
        subject_template: broadcast.subject_template.to_s,
        total_recipients: broadcast.total_recipients,
        sent_recipients: broadcast.sent_recipients,
        failed_recipients: broadcast.failed_recipients,
        pending_recipients: broadcast.pending_recipients_count,
        last_error: broadcast.last_error.to_s,
        started_at: broadcast.started_at,
        completed_at: broadcast.completed_at,
        failed_at: broadcast.failed_at,
        updated_at: broadcast.updated_at,
        created_at: broadcast.created_at,
      }

      return serialized unless include_recipients

      serialized.merge(
        recipients: broadcast.recipients.order(position: :asc).limit(100).map { |recipient| serialize_recipient(recipient) }
      )
    end

    def serialize_recipient(recipient)
      {
        id: recipient.id.to_s,
        email: recipient.email,
        name: recipient.name,
        first_name: recipient.first_name,
        last_name: recipient.last_name,
        country: recipient.country,
        username: recipient.username,
        display_name: recipient.display_name,
        event_titles: recipient.event_titles,
        ticket_titles: recipient.ticket_titles,
        source_labels: recipient.source_labels,
        source_types: recipient.source_types,
        status: recipient.status,
        error_message: recipient.error_message.to_s,
        sent_at: recipient.sent_at,
        failed_at: recipient.failed_at,
      }
    end
  end
end
