module UserLinks
  class SpotifyLink < UserLink
    validates :username, presence: true

    def icon_class
      'fa-brands fa-spotify'
    end

    def image_name
      "logos/spotify.jpg"
    end

    protected

    def generate_url
      "https://open.spotify.com/artist/#{username}"
    end
  end
end
