module AlbumsHelper


  def self.default_image_sqr
    type = [3].sample
    "/images/default-sq#{type}.jpg"
  end
end
