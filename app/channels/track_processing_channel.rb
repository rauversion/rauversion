class TrackProcessingChannel < ApplicationCable::Channel
  def subscribed
    track = Track.find_by(id: params[:track_id], user_id: current_user&.id)

    if track
      stream_from "track_processing_#{track.id}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
