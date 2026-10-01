class AlbumsController < ApplicationController
  include ReleasePageMetadata

  before_action :disable_footer, only: :show

  def show
    @release = Release.for_tenant.friendly.find(params[:id])

    set_release_page_metadata(@release, url: album_url(@release))

    respond_to do |format|
      format.html { render_blank }
      format.json
    end
  end

  def index
    set_page_metadata(
      title: I18n.t("albums.title"),
      description: I18n.t("albums.description"),
      image: default_release_image_url,
      url: albums_url,
      type: "website"
    )

    respond_to do |format|
      format.html { render_blank }
      format.json { render json: { seo: @seo_metadata } }
    end
  end

end
