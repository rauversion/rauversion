class Photo < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :photoable, polymorphic: true, optional: true

  has_one_attached :image

  # Virtual attribute to receive a signed_id from ActiveStorage DirectUpload
  attr_accessor :attach_signed_id

  # Attach the uploaded blob (by signed_id) before validation on create,
  # so presence validations on :image can run without hacks.
  before_validation :attach_image_from_signed_id, on: :create

  validates :image, presence: true, on: :create

  private

  def attach_image_from_signed_id
    return if attach_signed_id.blank?
    return if image.attached?
    # Attach directly using the signed_id string (ActiveStorage resolves it)
    image.attach(attach_signed_id)
  end
end
