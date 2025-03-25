module UserLinks
  class InstagramLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-instagram'
    end


    def image_name
      "logos/instagram.svg"
    end

    protected

    def generate_url
      "https://instagram.com/#{username}"
    end
  end
end
