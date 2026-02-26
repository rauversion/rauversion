class NewRepostNotificationJob < ApplicationJob
  queue_as :default

  def perform(repost_id)
    repost = Repost.find_by(id: repost_id)
    return unless repost

    reposter = repost.user
    track = repost.track
    user = track.user

    return if user == reposter
    return unless user.repost_of_your_post_email?

    NotificationMailer.with(
      reposter: reposter,
      user: user,
      track: track
    ).new_repost.deliver_now
  end
end
