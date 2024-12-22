module UserLinks
  class FacebookLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-facebook'
    end

    def image_name
      "logos/facebook.jpg"
    end

    protected

    def generate_url
      "https://facebook.com/#{username}"
    end
  end
end
