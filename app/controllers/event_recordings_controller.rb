class EventRecordingsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :set_event_recording, only: [:show, :update, :destroy]

  respond_to :json

  def index
    @event_recordings = @event.event_recordings
                             .order(position: :asc, created_at: :desc)
                             .page(params[:page])
                             .per(20)
    respond_with(@event_recordings)
  end

  def show
    respond_with(@event_recording)
  end

  def new
    @event_recording = @event.event_recordings.new
  end

  def create
    @event_recording = @event.event_recordings.build(event_recording_params)
    @event_recording.save
    respond_with(@event_recording)
  end

  def edit
    @event_recording = @event.event_recordings.find(params[:id])
  end

  def update
    @event_recording.update(event_recording_params)
    respond_with(@event_recording)
  end

  def destroy
    @event_recording.destroy
    respond_with(@event_recording)
  end

  private

  def set_event
    @event = Event.find_by!(slug: params[:event_id])
  end

  def set_event_recording
    @event_recording = @event.event_recordings.find(params[:id])
  end

  def event_recording_params
    params.require(:event_recording).permit(
      :type,
      :title,
      :description,
      :iframe,
      :position,
      properties: {}
    )
  end
end
