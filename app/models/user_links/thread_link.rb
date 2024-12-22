module UserLinks
  class ThreadLink < UserLink
    validates :username, presence: true
    validates :username, format: { 
      without: /\A@/, 
      message: "should not include @ symbol" 
    }

    def icon_class
      'fa-brands fa-threads'
    end

    protected

    def generate_url
      # Threads URLs always use @ symbol, but we don't want users to input it
      "https://threads.net/@#{username}"
    end
  end
end
