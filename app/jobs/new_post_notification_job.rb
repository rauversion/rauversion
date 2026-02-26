class NewPostNotificationJob < ApplicationJob
  queue_as :default

  def perform(track_id)
    track = Track.find_by(id: track_id)
    return unless track
    return if track.private?

    author = track.user
    followers = author.followers(User)

    followers.each do |follower|
      next unless follower.new_post_by_followed_user_email?

      NotificationMailer.with(
        author: author,
        user: follower,
        track: track
      ).new_post.deliver_later
    end
  end
end
