module UserLinks
  class TiktokLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-tiktok'
    end

    def image_name
      "logos/tiktok.svg"
    end

    protected

    def generate_url
      "https://tiktok.com/@#{username}"
    end
  end
end
