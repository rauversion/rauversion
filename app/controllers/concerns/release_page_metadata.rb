module ReleasePageMetadata
  extend ActiveSupport::Concern
  include PageMetadata

  private

  def set_release_page_metadata(release, url:)
    description = [release.subtitle, release.playlist&.description].filter_map do |text|
      CGI.unescapeHTML(helpers.strip_tags(text.to_s)).squish.presence
    end.first || "Listen to #{release.title} on Rauversion."
    cover = if release.cover.attached?
      release.cover
    elsif release.playlist&.cover&.attached?
      release.playlist.cover
    end

    set_page_metadata(
      title: release.title,
      description: helpers.truncate(description, length: 160),
      image: cover ? rails_blob_url(cover) : default_release_image_url,
      url: url,
      type: "music.album"
    )
  end

  def default_release_image_url
    "#{request.base_url}#{AlbumsHelper.default_image_sqr}"
  end
end
