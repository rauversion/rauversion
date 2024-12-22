module UserLinks
  class WebsiteLink < UserLink
    validates :custom_url, presence: true, url: true

    def icon_class
      'fa-solid fa-globe'
    end

    protected

    def generate_url
      custom_url
    end
  end
end
