module Croppable
  extend ActiveSupport::Concern

  included do
    # Ensure the model using this concern has an image attachment and crop_data attribute
    # validates :crop_data, presence: true, if: :crop_data_present_and_valid?
  end

 # Method to generate a cropped image variant
  # @param attached_attribute [Symbol] the name of the ActiveStorage attachment (e.g., :cover)
  # @param crop_data_attribute [Symbol] the name of the crop data attribute (e.g., :crop_data)
  # @param fallback [Symbol] the fallback type if cropping isn't valid (default: :horizontal)
  def cropped_image_setup(attached_attribute:, crop_data_attribute:, fallback: :horizontal)
    image = public_send(attached_attribute) # Access the attachment dynamically
    return send("#{attached_attribute}_url", fallback) unless crop_data_present_and_valid?(crop_data_attribute)

    crop_data_hash = public_send(crop_data_attribute)
    image.variant(
      crop: [
        crop_data_hash['x'], 
        crop_data_hash['y'], 
        crop_data_hash['width'], 
        crop_data_hash['height']
      ]
    ).processed
  end

  private

  # Validate crop data
  # @param crop_data_attribute [Symbol] the name of the crop data attribute
  def crop_data_present_and_valid?(crop_data_attribute)
    crop_data = public_send(crop_data_attribute)
    return false unless crop_data.present?

    data = crop_data rescue nil
    return false unless data.is_a?(Hash)

    %w[x y width height].all? { |key| data.key?(key) && data[key].to_f >= 0 }
  end

  # Fallback image logic (customize as needed)
  # @param fallback [Symbol] the fallback type
  def fallback_image(fallback)
    # Implement logic for returning a fallback image
    
  end
end