class EventListContact < ApplicationRecord
  belongs_to :event_list

  validates :email, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :event_list_id }

  before_validation :normalize_email

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
