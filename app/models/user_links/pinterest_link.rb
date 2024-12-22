module UserLinks
  class PinterestLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-pinterest'
    end

    protected

    def generate_url
      "https://pinterest.com/#{username}"
    end
  end
end
