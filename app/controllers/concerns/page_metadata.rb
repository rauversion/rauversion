module PageMetadata
  extend ActiveSupport::Concern

  private

  def set_page_metadata(title:, description:, image:, url:, type:, image_alt: nil)
    @seo_metadata = { title: title, description: description, image: image, url: url, type: type }
    @seo_metadata[:image_alt] = image_alt if image_alt.present?
    social_image = image_alt.present? ? { _: image, alt: image_alt } : image

    set_meta_tags(
      title: title,
      description: description,
      image: image,
      canonical: url,
      og: {
        title: title,
        description: description,
        image: social_image,
        url: url,
        type: type,
        site_name: "Rauversion"
      },
      twitter: {
        card: "summary_large_image",
        site: "@rauversion",
        title: title,
        description: description,
        image: social_image
      }
    )
    @seo_metadata[:document_title] = CGI.unescapeHTML(meta_tags.full_title(site: "Rauversion"))
  end
end
