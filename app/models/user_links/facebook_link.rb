module UserLinks
  class FacebookLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-facebook'
    end

    protected

    def generate_url
      "https://facebook.com/#{username}"
    end
  end
end
