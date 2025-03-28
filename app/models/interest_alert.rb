class InterestAlert < ApplicationRecord
  belongs_to :user

  validates :body, presence: true
  validates :role, presence: true

  after_create :notify_admins

  def approve!
    update(approved: true)
    case role
    when 'artist'
      user.update(role: role)
    when 'seller'
      user.update(seller: true, role: "artist")
    end
    
  end

  private

  def notify_admins
    User.where(role: 'admin').find_each do |admin|
      InterestAlertMailer.notify_admin(self, admin).deliver_later
    end
  end
end
