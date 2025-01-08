module Products
  class MusicProduct < PhysicalProduct
    validates :category, inclusion: { in: ['vinyl', 'cassette', 'cd'] }
    validates :album, presence: true
    validates :include_digital_album, inclusion: { in: [true, false] }
    validates :limited_edition_count, presence: true, if: :limited_edition

    before_validation :set_music_defaults

    private

    def set_music_defaults
      self.include_digital_album = true if include_digital_album.nil?
    end
  end
end
