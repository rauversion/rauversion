# frozen_string_literal: true

require "http"
require "json"
require "nokogiri"
require "uri"

class XPostMetadata
  SYNDICATION_URL = "https://cdn.syndication.twimg.com/tweet-result"
  OEMBED_URL = "https://publish.x.com/oembed"
  STATUS_PATH = %r{\A/(?:\w{1,15}|i/web)/status/([1-9]\d{0,19})(?:/(?:photo|video)/[1-9]\d*)?/?\z}
  VIDEO_TYPES = %w[video/mp4 application/x-mpegurl application/vnd.apple.mpegurl].freeze

  def self.post_id(value)
    url = URI.parse(value)
    return unless url.is_a?(URI::HTTP) && !url.userinfo
    return unless %w[x.com twitter.com].include?(url.host.to_s.downcase.sub(/\A(?:www|mobile|m)\./, ""))
    return unless url.port == url.class.default_port

    url.path[STATUS_PATH, 1]
  rescue URI::InvalidURIError
    nil
  end

  def self.embedded?(html)
    html&.start_with?("<div data-x-post-embed=")
  end

  def self.media_from_html(html)
    return unless embedded?(html)

    fragment = Nokogiri::HTML.fragment(html)
    images = []
    videos = []
    fragment.css("div[data-x-post-embed] > img, div[data-x-post-embed] > video").each do |element|
      dimensions = {
        width: Integer(element["width"], exception: false),
        height: Integer(element["height"], exception: false)
      }.compact

      if element.name == "video"
        poster = element["poster"]
        source = element.at_css("source")
        images << dimensions.merge(url: poster, alt: element["aria-label"]).compact if poster
        videos << dimensions.merge(url: source["src"], content_type: source["type"], poster_url: poster).compact if source
      else
        images << dimensions.merge(url: element["src"], alt: element["alt"].presence).compact
      end
    end

    {images: images, videos: videos}
  end

  def initialize(http: HTTP.timeout(5))
    @http = http
  end

  def call(id)
    # X's public embed endpoint requires a non-empty token parameter.
    post = get_json(SYNDICATION_URL, id: id, lang: "en", token: id)
    return unless post && post["id_str"] == id

    items = Array(post["mediaDetails"]).filter_map { |item| media_item(item) if item.is_a?(Hash) }
    author = post["user"].is_a?(Hash) ? post["user"] : {}
    author_url = "https://x.com/#{author['screen_name']}" if author["screen_name"].present?
    type = :rich
    type = :photo if items.any?
    type = :video if items.any? { |item| item[:video] }

    {
      type: type,
      title: author["name"],
      description: post["text"],
      author_name: author["name"],
      author_url: author_url,
      html: embed_html(items, id, post["text"])
    }
  end

  def oembed(id)
    result = get_json(OEMBED_URL, url: post_url(id))
    return unless result&.fetch("html", nil).present?

    {
      type: :rich,
      title: result["author_name"],
      author_name: result["author_name"],
      author_url: result["author_url"],
      html: result["html"]
    }
  end

  private

  def get_json(url, params)
    response = @http.get(url, params: params)
    return unless response.code == 200

    parsed = JSON.parse(response.to_s)
    parsed if parsed.is_a?(Hash)
  rescue HTTP::Error, JSON::ParserError
    nil
  end

  def media_item(item)
    return unless %w[photo video animated_gif].include?(item["type"])

    info = item["original_info"]
    size = info.is_a?(Hash) ? info.slice("width", "height") : {}
    image_url = cdn_url(item["media_url_https"], "pbs.twimg.com")
    image = size.merge("url" => image_url, "alt" => item["ext_alt_text"]).compact if image_url
    variant = video_variant(item) unless item["type"] == "photo"
    video = size.merge(variant, "poster_url" => image_url).compact if variant

    {image: image, video: video} if image || video
  end

  def video_variant(item)
    info = item["video_info"]
    return unless info.is_a?(Hash)

    candidates = Array(info["variants"]).select do |variant|
      variant.is_a?(Hash) && VIDEO_TYPES.include?(variant["content_type"].to_s.downcase) && cdn_url(variant["url"], "video.twimg.com")
    end
    best = candidates.max_by { |variant| [variant["content_type"].casecmp?("video/mp4") ? 1 : 0, variant["bitrate"].to_i] }
    best&.slice("url", "content_type")
  end

  def cdn_url(value, host)
    return unless value.is_a?(String)

    url = URI.parse(value)
    value if url.is_a?(URI::HTTPS) && url.host == host && !url.userinfo && url.port == 443
  rescue URI::InvalidURIError
    nil
  end

  def embed_html(items, id, text)
    helpers = ActionController::Base.helpers
    tag = helpers.tag
    media = items.map do |item|
      if (video = item[:video])
        source = tag.source(src: video["url"], type: video["content_type"])
        tag.video(source, controls: true, playsinline: true, preload: "none", poster: video["poster_url"],
          width: video["width"], height: video["height"], aria: {label: item.dig(:image, "alt")}, style: "width:100%;height:auto")
      else
        image = item.fetch(:image)
        tag.img(src: image["url"], alt: image["alt"] || "", width: image["width"], height: image["height"],
          loading: "lazy", style: "max-width:100%;height:auto")
      end
    end
    media << tag.blockquote(tag.p(text) + tag.a("X", href: post_url(id)), class: "twitter-tweet") if media.empty?

    tag.div(helpers.safe_join(media), data: {x_post_embed: true})
  end

  def post_url(id)
    "https://x.com/i/status/#{id}"
  end
end
