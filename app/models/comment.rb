class Comment < ApplicationRecord
  belongs_to :commentable, polymorphic: true
  belongs_to :user

  after_create_commit :notify_commentable_owner

  private

  def notify_commentable_owner
    NewCommentNotificationJob.perform_later(id)
  end
end
