class GlobalChannel < ApplicationCable::Channel
  def subscribed
    stream_from "global_events"
  end

  def unsubscribed
    stop_all_streams
  end
end
