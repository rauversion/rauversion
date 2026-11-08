module Newsletter
  class CopilotController < BaseController
    rate_limit to: 6, within: 1.minute, by: -> { current_user.id }, with: -> {
      render json: { errors: ["Has generado varias propuestas. Espera un momento y vuelve a intentarlo."] }, status: :too_many_requests
    }, only: :create

    def events
      render json: { events: reminder_events.order(event_start: :desc).map { |event| { id: event.id.to_s, title: event.title, starts_at: event.event_start } } }
    end

    def create
      input = params.expect(newsletter_copilot: [
        :mode, :prompt, :original_text, :event_id, :block_type,
        { editor_context: [:name, :subject, :preheader, :selected_block_id,
          { blocks: [[:id, :type, { fields: [[:key, :text]], assets: [[:kind, :url, :label]] }]] }],
          history: [[:role, :text]] },
      ])
      if input[:mode] == "reminder" || (input[:mode] == "edit" && input[:event_id].present?)
        event_context = reminder_context(input[:event_id])
      end
      suggestion = Newsletter::Copilot.new(**input.except(:event_id).to_h.symbolize_keys, event_context: event_context).call

      render json: { suggestion: suggestion }
    rescue Newsletter::Copilot::InvalidInput => e
      render json: { errors: [e.message] }, status: :unprocessable_content
    rescue Newsletter::Copilot::NotConfigured
      render json: { errors: ["El copiloto aún no está configurado. Contacta al administrador."] }, status: :service_unavailable
    rescue Newsletter::Copilot::GenerationFailed => e
      render json: { errors: [e.message] }, status: :bad_gateway
    end

    private

    def reminder_events
      current_user.events.for_tenant
    end

    def reminder_context(event_id)
      event = reminder_events.find_by(id: event_id)
      raise Newsletter::Copilot::InvalidInput, "Selecciona un evento disponible en este sitio." unless event

      time_zone = Time.find_zone(event.timezone) || Time.zone
      show_location = !event.online? && !event.hide_location_until_purchase
      linkable = event.published? && (event.public? || event.unlisted?)

      {
        title: event.title,
        starts_at: event.event_start&.in_time_zone(time_zone)&.iso8601,
        ends_at: event.event_ends&.in_time_zone(time_zone)&.iso8601,
        timezone: time_zone.tzinfo.name,
        online: event.online?,
        venue: (event.venue.presence if show_location),
        city: (event.city.presence if show_location),
        event_url: (event_url(event) if linkable),
        cover_url: (rails_blob_url(event.cover) if linkable && event.cover.attached?),
      }.compact
    end
  end
end
