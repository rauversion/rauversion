class Newsletter::Contact < ApplicationRecord
  belongs_to :contact_list, class_name: "Newsletter::ContactList", inverse_of: :contacts

  validates :email, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :contact_list_id }

  before_validation :normalize_email

  def resolved_name
    name.presence || [first_name, last_name].compact.join(" ").strip.presence
  end

  private

  def normalize_email
    self.email = email.to_s.downcase.strip.presence
  end
end
