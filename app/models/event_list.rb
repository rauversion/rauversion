class EventList < ApplicationRecord
  belongs_to :event
  has_many :event_list_contacts, dependent: :destroy
  has_many :event_tickets, dependent: :nullify

  validates :name, presence: true
  validates :name, uniqueness: { scope: :event_id }

  def contact_emails
    event_list_contacts.pluck(:email)
  end

  def has_email?(email)
    return false if email.blank?
    event_list_contacts.exists?(email: email.downcase)
  end
end
