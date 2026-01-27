class ThemeDownloadChannel < ApplicationCable::Channel
  def subscribed
    # Stream from a unique channel for this theme download
    theme_id = params[:theme_id]
    user_id = current_user&.id
    
    if theme_id && user_id
      stream_from "theme_download_#{theme_id}_#{user_id}"
    else
      reject
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
