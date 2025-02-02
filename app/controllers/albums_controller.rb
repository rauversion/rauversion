class AlbumsController < ApplicationController

  before_action :disable_footer, only: :show

  def show
    @release = Release.friendly.find(params[:id])
    set_meta_tags(
      title: @release.title,
      description: "Listen #{@release.title} #{@release.subtitle} on Rauversion",
      og: {
        title: @release.title,
        description: "Listen #{@release.title} #{@release.subtitle} on Rauversion",
        image: (url_for(@release.cover) rescue nil),
        type: 'music.album',
        site_name: 'Rauversion'
      },
      twitter: {
        card: "summary_large_image",
        site: "@rauversion",
        title: @release.title,
        description: "Listen #{@release.title} #{@release.subtitle} on Rauversion",
        image: (url_for(@release.cover) rescue nil)
      }
    )

    respond_to do |format|
      format.html
      format.json
    end
  end

  def index
  end
end
