module ReleasePageMetadata
  extend ActiveSupport::Concern

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

  def set_page_metadata(title:, description:, image:, url:, type:)
    @seo_metadata = { title: title, description: description, image: image, url: url, type: type }
    set_meta_tags(
      title: title,
      description: description,
      image: image,
      canonical: url,
      og: {
        title: title,
        description: description,
        image: image,
        url: url,
        type: type,
        site_name: "Rauversion"
      },
      twitter: {
        card: "summary_large_image",
        site: "@rauversion",
        title: title,
        description: description,
        image: image
      }
    )
    @seo_metadata[:document_title] = CGI.unescapeHTML(meta_tags.full_title(site: "Rauversion"))
  end
end
