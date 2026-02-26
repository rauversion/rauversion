class NewFollowerNotificationJob < ApplicationJob
  queue_as :default

  def perform(follow_id)
    follow = Follow.find_by(id: follow_id)
    return unless follow

    follower = follow.follower
    user = follow.followable

    return unless user.is_a?(User)
    return unless user.new_follower_email?

    NotificationMailer.with(
      follower: follower,
      user: user
    ).new_follower.deliver_now
  end
end
