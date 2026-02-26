class Like < Socialization::ActiveRecordStores::Like
  after_create_commit :notify_likeable_owner

  private

  def notify_likeable_owner
    NewLikeNotificationJob.perform_later(id)
  end
end
