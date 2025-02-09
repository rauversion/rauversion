class EventStreamingServicesController < ApplicationController
  before_action :set_event
  before_action :authenticate_user!

  def new
    @service = params[:service]
    @service_klass = StreamingProviders::Service.find_module_by_type(params[:service])
    @service = @service_klass.new
    @service.assign_attributes(@event.streaming_service) if @event.streaming_service["name"] == params[:service]

    respond_to do |format|
      format.html
      format.json do
        render json: {
          fields: streaming_service_fields,
          default_values: streaming_service_defaults
        }
      end
    end
  end

  def update
    @service_klass = StreamingProviders::Service.find_module_by_type(params[:id])
    @service = @service_klass.new(build_params)
    @event.update(streaming_service: @service.as_json.merge(name: params[:id]))
    redirect_to event_path(@event)
  end

  private

  def set_event
    @event = Event.friendly.find(params[:event_id])
  end

  def build_params
    params.require(:streaming_service).permit!
  end

  def streaming_service_fields
    case params[:service]
    when "twitch"
      [
        {
          name: "streaming_type",
          type: "select",
          label: "Streaming Type",
          description: "Select your Twitch streaming type",
          options: [
            { value: "channel", label: "Channel" },
            { value: "video", label: "Video" },
            { value: "collection", label: "Collection" }
          ]
        },
        {
          name: "streaming_identifier",
          type: "text",
          label: "Identifier",
          description: "Your channel, video or collection identifier"
        }
      ]
    when "mux"
      [
        {
          name: "playback_id",
          type: "text",
          label: "Playback ID",
          description: "Your Mux playback ID"
        },
        {
          name: "title",
          type: "text",
          label: "Title",
          description: "Video title"
        }
      ]
    when "whereby"
      [
        {
          name: "room_url",
          type: "url",
          label: "Room URL",
          description: "Your Whereby room URL (e.g., https://user.whereby.com/abc)"
        }
      ]
    when "zoom"
      [
        {
          name: "meeting_url",
          type: "url",
          label: "Meeting URL",
          description: "Your Zoom meeting URL"
        },
        {
          name: "password",
          type: "text",
          label: "Password",
          description: "Meeting password"
        }
      ]
    else
      []
    end
  end

  def streaming_service_defaults
    return {} unless @event.streaming_service && @event.streaming_service["name"] == params[:service]

    # Only return the fields that are valid for the current service
    fields = streaming_service_fields.map { |f| f[:name] }
    @event.streaming_service.slice(*fields)
  end
end
