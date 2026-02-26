class Repost < ApplicationRecord
  belongs_to :user
  belongs_to :track

  after_create_commit :notify_track_owner

  private

  def notify_track_owner
    NewRepostNotificationJob.perform_later(id)
  end
end
