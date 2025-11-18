class EventHost < ApplicationRecord
  belongs_to :event
  belongs_to :user

  has_one_attached :avatar

  attr_accessor :email

  # before_save :invite_user

  def invite_user
    if email.present?
      # Find the existing user or create and invite a new one
      invited_user = User.find_by(email: email) || User.invite!(email: email)

      # Associate the invited user with the event host
      self.user = invited_user
    end
  end

  def avatar_url(size = :medium)
    return nil unless avatar.attached?

    url = case size
    when :medium
      avatar.variant(resize_to_fill: [200, 200])
    when :large
      avatar.variant(resize_to_fill: [500, 500])
    when :small
      avatar.variant(resize_to_fill: [50, 50])
    else
      avatar.variant(resize_to_fill: [200, 200])
    end

    Rails.application.routes.url_helpers.rails_storage_proxy_url(url) if url.present?
  end
end
