class HomeController < ApplicationController
  respond_to :html, :json

  def index
    set_meta_tags(
      title: "Rauversion",
      description: "Stream Rauversion.",
      image: helpers.image_url("gritt-zheng-uCUkq5H0_Y0-unsplash.jpg")
    )

    @artists = User.artists
      .with_attached_avatar
      .order("id desc").limit(12)

    @posts = Post.published
      .with_attached_cover
      .includes(user: { avatar_attachment: :blob })
      .order("id desc").limit(4)

    @albums = Playlist.published
    .latests
    .includes(:releases)
    .where(playlist_type: ["ep", "album"])
    .order("editor_choice_position asc, release_date desc, id desc")

    @playlists = Playlist.published
    .latests
    .includes(:releases)
    .where.not(playlist_type: ["ep", "album"])
    .order("editor_choice_position asc, release_date desc, id desc")


    @latest_releases = Track.published.latests
    .with_attached_cover
    .includes(user: { avatar_attachment: :blob })
    .limit(12)

    respond_with(@artists, @posts, @albums, @playlists, @latest_releases)
  end
end
