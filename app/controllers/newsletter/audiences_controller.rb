module Newsletter
  class AudiencesController < BaseController
    before_action :set_audience, only: [:show, :update, :destroy]

    def index
      respond_to do |format|
        format.html { render_blank }
        format.json do
          render json: {
            audiences: current_user.newsletter_audiences
              .includes(:sources)
              .order(updated_at: :desc)
              .map { |audience| serialize_audience(audience) },
          }
        end
      end
    end

    def show
      render json: {
        audience: serialize_audience(@audience),
      }
    end

    def create
      audience = current_user.newsletter_audiences.new(audience_params)

      ActiveRecord::Base.transaction do
        audience.save!
        replace_sources!(audience, normalized_sources_param)
      end

      render json: { audience: serialize_audience(audience.reload) }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    def update
      ActiveRecord::Base.transaction do
        @audience.update!(audience_params)
        replace_sources!(@audience, normalized_sources_param)
      end

      render json: { audience: serialize_audience(@audience.reload) }
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    def destroy
      @audience.destroy
      head :no_content
    end

    def source_options
      render json: {
        source_types: [
          { value: "contact_list", label: "Lista de contactos" },
          { value: "followers", label: "Followers" },
          { value: "event_attendees", label: "Asistentes de un evento" },
          { value: "all_my_event_attendees", label: "Asistentes de todos mis eventos" },
        ],
        contact_lists: current_user.newsletter_contact_lists.order(updated_at: :desc).map do |contact_list|
          {
            id: contact_list.id.to_s,
            name: contact_list.name,
            contacts_count: contact_list.contacts.count,
          }
        end,
        events: current_user.events.order(updated_at: :desc).map do |event|
          {
            id: event.id.to_s,
            title: event.title,
            slug: event.slug,
            starts_at: event.event_start,
          }
        end,
        follower_count: current_user.followers(User).count,
      }
    end

    def preview
      preview = Newsletter::AudienceResolver.new(
        user: current_user,
        sources: normalized_sources_param
      ).resolve

      render json: { preview: preview }
    end

    private

    def set_audience
      @audience = current_user.newsletter_audiences.includes(:sources).find(params[:id])
    end

    def audience_params
      params.require(:audience).permit(:name)
    end

    def replace_sources!(audience, sources)
      audience.sources.destroy_all

      sources.each_with_index do |source, index|
        audience.sources.create!(
          source_type: source["source_type"],
          source_settings: source["source_settings"],
          position: index
        )
      end
    end

    def normalized_sources_param
      raw_sources =
        if params[:audience].respond_to?(:[])
          params[:audience][:sources]
        else
          params[:sources]
        end

      Array(raw_sources).map do |source|
        normalized = normalize_json_value(source)
        {
          "source_type" => (normalized["source_type"] || normalized["sourceType"]).to_s,
          "source_settings" => normalize_json_value(normalized["source_settings"] || normalized["sourceSettings"] || {}),
        }
      end.reject { |source| source["source_type"].blank? }
    end

    def normalize_json_value(value)
      case value
      when ActionController::Parameters
        value.to_unsafe_h.transform_values { |item| normalize_json_value(item) }
      when Array
        value.map { |item| normalize_json_value(item) }
      else
        value
      end
    end

    def serialize_audience(audience)
      {
        id: audience.id.to_s,
        name: audience.name,
        updated_at: audience.updated_at,
        created_at: audience.created_at,
        sources: audience.sources.sort_by(&:position).map { |source| serialize_source(source) },
      }
    end

    def serialize_source(source)
      {
        id: source.id.to_s,
        source_type: source.source_type,
        source_settings: source.source_settings,
        label: source_label(source),
      }
    end

    def source_label(source)
      case source.source_type
      when "contact_list"
        current_user.newsletter_contact_lists.find_by(id: source.source_settings["contact_list_id"])&.name || "Lista no encontrada"
      when "followers"
        "Followers"
      when "event_attendees"
        Event.find_by(id: source.source_settings["event_id"])&.title || "Evento no encontrado"
      when "all_my_event_attendees"
        "Asistentes de todos mis eventos"
      else
        source.source_type.humanize
      end
    end
  end
end
