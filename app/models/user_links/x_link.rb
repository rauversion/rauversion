module UserLinks
  class XLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-x-twitter'
    end

    protected

    def generate_url
      "https://x.com/#{username}"
    end
  end
end
