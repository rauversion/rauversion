class MasteringChannel < ApplicationCable::Channel
  def subscribed
    track_master = TrackMaster.joins(:track).find_by(
      id: params[:track_master_id],
      tracks: { user_id: current_user.id }
    )

    if track_master
      stream_from "mastering_#{track_master.id}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
