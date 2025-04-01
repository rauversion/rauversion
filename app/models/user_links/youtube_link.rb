module UserLinks
  class YoutubeLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-youtube'
    end

    def image_name
      "logos/youtube.svg"
    end

    protected

    def generate_url
      "https://youtube.com/@#{username}"
    end
  end
end
