module Notifiable
  extend ActiveSupport::Concern

  class_methods do
    def broadcast_notification(user_id, data)
      ActionCable.server.broadcast(
        "notifications_#{user_id}",
        data
      )
    end

    def broadcast_global(data)
      ActionCable.server.broadcast(
        "global_events",
        data
      )
    end
  end

  # Instance methods for controllers/models
  def broadcast_notification(user_id, data)
    self.class.broadcast_notification(user_id, data)
  end

  def broadcast_global(data)
    self.class.broadcast_global(data)
  end
end
