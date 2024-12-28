class PodcasterHost < ApplicationRecord
  belongs_to :user
  belongs_to :podcaster_info

  validates :user_id, uniqueness: { scope: :podcaster_info_id }
  validates :role, presence: true
end
