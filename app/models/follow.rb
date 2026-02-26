class Follow < Socialization::ActiveRecordStores::Follow
  after_create_commit :notify_followable

  private

  def notify_followable
    NewFollowerNotificationJob.perform_later(id)
  end
end
