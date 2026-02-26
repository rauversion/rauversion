class NewPostNotificationJob < ApplicationJob
  queue_as :default

  def perform(post_id)
    post = Post.find_by(id: post_id)
    return unless post
    return unless post.state == "published" && !post.private?

    author = post.user
    followers = author.followers(User)

    followers.each do |follower|
      next unless follower.new_post_by_followed_user_email?

      NotificationMailer.with(
        author: author,
        user: follower,
        post: post
      ).new_post.deliver_later
    end
  end
end
