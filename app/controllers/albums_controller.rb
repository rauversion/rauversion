class AlbumsController < ApplicationController

  before_action :disable_footer, only: :show

  def show
    @release = Release.for_tenant.friendly.find(params[:id])

    description = [@release.subtitle, @release.playlist&.description].filter_map do |text|
      CGI.unescapeHTML(helpers.strip_tags(text.to_s)).squish.presence
    end.first || "Listen to #{@release.title} on Rauversion."
    cover = if @release.cover.attached?
      @release.cover
    elsif @release.playlist&.cover&.attached?
      @release.playlist.cover
    end

    set_album_meta_tags(
      title: @release.title,
      description: helpers.truncate(description, length: 160),
      image: cover ? rails_blob_url(cover) : default_album_image_url,
      url: album_url(@release),
      type: "music.album"
    )

    respond_to do |format|
      format.html { render_blank }
      format.json
    end
  end

  def index
    set_album_meta_tags(
      title: I18n.t("albums.title"),
      description: I18n.t("albums.description"),
      image: default_album_image_url,
      url: albums_url,
      type: "website"
    )

    respond_to do |format|
      format.html { render_blank }
      format.json { render json: { seo: @seo_metadata } }
    end
  end

  private

  def default_album_image_url
    "#{request.base_url}#{AlbumsHelper.default_image_sqr}"
  end

  def set_album_meta_tags(title:, description:, image:, url:, type:)
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
        site_name: 'Rauversion'
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
