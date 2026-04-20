class Newsletter::ContactList < ApplicationRecord
  belongs_to :user
  has_many :contacts, class_name: "Newsletter::Contact", dependent: :destroy, inverse_of: :contact_list

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id }
end
