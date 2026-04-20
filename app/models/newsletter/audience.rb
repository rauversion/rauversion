class Newsletter::Audience < ApplicationRecord
  belongs_to :user
  has_many :sources, class_name: "Newsletter::AudienceSource", dependent: :destroy, inverse_of: :audience

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id }
end
