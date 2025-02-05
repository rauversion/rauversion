class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    if current_user.present?
      stream_from "notifications_#{current_user.id}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
