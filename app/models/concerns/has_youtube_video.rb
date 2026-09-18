module HasYoutubeVideo
  extend ActiveSupport::Concern

  included do
    normalizes :youtube_url, with: ->(url) { url.strip.presence }
    validate :valid_youtube_url
  end

  def youtube_video_id
    return if youtube_url.blank?

    uri = URI.parse(youtube_url)
    return unless %w[http https].include?(uri.scheme)
    return if uri.userinfo.present? || uri.port != uri.default_port

    video_id = case uri.host&.downcase
    when "youtu.be", "www.youtu.be"
      uri.path.match(%r{\A/([\w-]{11})/?\z})&.[](1)
    when "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"
      if uri.path == "/watch"
        URI.decode_www_form(uri.query.to_s).find { |key, _| key == "v" }&.last
      else
        uri.path.match(%r{\A/(?:embed|shorts|live)/([\w-]{11})/?\z})&.[](1)
      end
    when "youtube-nocookie.com", "www.youtube-nocookie.com"
      uri.path.match(%r{\A/embed/([\w-]{11})/?\z})&.[](1)
    end

    video_id if video_id&.match?(/\A[\w-]{11}\z/)
  rescue URI::InvalidURIError, ArgumentError
    nil
  end

  private

  def valid_youtube_url
    if youtube_url.present? && youtube_video_id.nil?
      errors.add(:youtube_url, I18n.t("courses.lesson_form.youtube_url_invalid"))
    end
  end
end
