module UserLinks
  class SnapchatLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-snapchat'
    end

    def image_name
      "logos/snapchat.svg"
    end

    protected

    def generate_url
      "https://snapchat.com/add/#{username}"
    end
  end
end
