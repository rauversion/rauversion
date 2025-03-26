class HomeController < ApplicationController
  respond_to :html, :json

  def index
    set_meta_tags(
      title: "Rauversion",
      description: "Stream Rauversion.",
      image: helpers.image_url("gritt-zheng-uCUkq5H0_Y0-unsplash.jpg")
    )

    section = params[:section]

    case section
    when 'artists'
      @artists = fetch_artists
      render "users/index" and return
    when 'posts'
      @articles = fetch_posts
      render "articles/index" and return
    when 'releases'
      @releases = fetch_releases
      render "releases/index" and return
    when 'albums'
      @playlists = fetch_albums
      render "playlists/index" and return
    when 'playlists'
      @playlists = fetch_playlists
      render "playlists/index" and return
    when 'latest_releases'
      @tracks = fetch_latest_releases
      render "tracks/index" and return
    when 'podcasts'
      @tracks = fetch_podcasts
      render "tracks/index" and return
    else
      # fetch_all
    end

    if section
      respond_with(@data)
    else
      respond_to do |format|
        format.html { render "shared/blank" }
        format.json
      end
      # respond_with(@artists, @posts, @albums, @playlists, @latest_releases)
    end
  end

  private

  def fetch_all
    @artists = fetch_artists
    @posts = fetch_posts
    @releases = fetch_releases
    @albums = fetch_albums
    @playlists = fetch_playlists
    @latest_releases = fetch_latest_releases
  end

  def fetch_artists
    User.artists
      .with_attached_avatar
      .order("id desc")
      .page(params[:page])
      .per(12)
  end

  def fetch_posts
    Post.published
      .with_attached_cover
      .includes(user: { avatar_attachment: :blob })
      .latests
      .page(params[:page])
      .per(5)
  end

  def fetch_releases
    Release
      .where(published: true)
      .order("id desc")
      .page(params[:page])
      .per(10)
  end

  def fetch_albums
    Playlist.published
      .latests
      .includes(:releases)
      .where(playlist_type: ["ep", "album"])
      .where("editor_choice_position is not null")
      .order("editor_choice_position asc, release_date desc, id desc")
      .page(params[:page])
      .per(10)
  end

  def fetch_playlists
    Playlist.published
      .latests
      .includes(:releases)
      .where(playlist_type: ["playlist"])
      .order("editor_choice_position asc, release_date desc, id desc")
      .page(params[:page])
      .per(10)
  end

  def fetch_podcasts
    Track.published
    .latests
    .with_attached_cover
    .where(podcast: "podcast")
    .includes(user: { avatar_attachment: :blob })
    .page(params[:page])
    .per(10)
  end

  def fetch_latest_releases
    Track.published
      .latests
      .with_attached_cover
      .includes(user: { avatar_attachment: :blob })
      .where.not(podcast: "podcast")
      .page(params[:page])
      .per(10)
  end
end
