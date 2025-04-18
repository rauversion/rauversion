module UserLinks
  class SoundcloudLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-soundcloud'
    end

    def image_name
      "logos/soundcloud.svg"
    end

    protected

    def generate_url
      "https://soundcloud.com/#{username}"
    end
  end
end
