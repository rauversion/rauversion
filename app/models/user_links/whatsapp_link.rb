module UserLinks
  class WhatsappLink < UserLink
    validates :username, presence: true, format: { 
      with: /\A\+?[1-9]\d{1,14}\z/, 
      message: "should be a valid phone number (e.g., +1234567890)" 
    }

    def icon_class
      'fa-brands fa-whatsapp'
    end

    def image_name
      "logos/whatsapp.svg"
    end

    protected

    def generate_url
      # Remove any non-digit characters from the phone number
      clean_number = username.gsub(/\D/, '')
      "https://wa.me/#{clean_number}"
    end

    private

    def set_default_title
      self.title = "WhatsApp"
    end
  end
end
