class NewCommentNotificationJob < ApplicationJob
  queue_as :default

  def perform(comment_id)
    comment = Comment.find_by(id: comment_id)
    return unless comment

    commenter = comment.user
    commentable = comment.commentable
    return unless commentable.respond_to?(:user)

    user = commentable.user
    return if user == commenter
    return unless user.comment_on_your_post_email?

    NotificationMailer.with(
      commenter: commenter,
      user: user,
      comment: comment,
      commentable: commentable
    ).new_comment.deliver_now
  end
end
