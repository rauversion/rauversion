class Photo < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :photoable, polymorphic: true, optional: true
  has_one_attached :image
  
  validates :image, presence: true, on: :create
end
