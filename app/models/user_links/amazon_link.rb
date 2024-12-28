module UserLinks
  class AmazonLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-amazon'
    end

    def image_name
      "logos/amazon.jpg"
    end

    protected

    def generate_url
      "https://amazon.com/shop/#{username}"
    end
  end
end
