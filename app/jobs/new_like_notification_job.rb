class NewLikeNotificationJob < ApplicationJob
  queue_as :default

  def perform(like_id)
    like = Like.find_by(id: like_id)
    return unless like

    liker = like.liker
    likeable = like.likeable
    return unless likeable.respond_to?(:user)

    user = likeable.user
    return if user == liker
    return unless user.like_and_plays_on_your_post_email?

    NotificationMailer.with(
      liker: liker,
      user: user,
      likeable: likeable
    ).new_like.deliver_now
  end
end
