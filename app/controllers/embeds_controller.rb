class EmbedsController < ApplicationController
  layout "embed"

  before_action :remove_frame_options_header

  def show
    @track = Track.friendly.find(params[:track_id]) if params[:track_id].present?
    @playlist = Playlist.friendly.find(params[:playlist_id]) if params[:playlist_id].present?
  end

  #  def show
  #    @track = Track.find_public_track_with_user(params[:track_id])
  #    return render status: 404, plain: 'This track is private or not found' unless @track
  #
  #    render :show
  #  end

  def show_playlist
    @playlist = Playlist.published.friendly.find(params[:playlist_id])
    return render status: 404, plain: "This playlist is private or not found" unless @playlist

    render :show
  end

  def private_playlist
    @playlist = Playlist.find_by_signed_id(params[:playlist_id])
    return render status: 404, plain: "This playlist is private or not found" unless @playlist

    render :show_playlist
  end

  def oembed_show
    if params[:track_id]
      @track = Track.friendly.find(params[:track_id])
      return render status: 404, plain: "This track is private or not found" unless @track
      render json: data_for_oembed_track(@track)
    else
      @playlist = Playlist.friendly.find(params[:playlist_id])
      return render status: 404, plain: "This playlist is private or not found" unless @playlist
      render json: data_for_oembed_playlist(@playlist)
    end
  end

  def oembed_private_show
    @track = Track.find_signed(params[:track_id])
    return render status: 404, plain: "This track is private or not found" unless @track

    render json: data_for_oembed_track(@track)
  end

  def private_track
    @track = Track.find_signed(params[:track_id])
    return render status: 404, plain: "This track is private or not found" unless @track

    render :show
  end

  def private_playlist
    @playlist = Playlist.find_signed(params[:playlist_id])
    return render status: 404, plain: "This playlist is private or not found" unless @playlist

    render :show
  end

  private

  def remove_frame_options_header
    response.headers.except! "X-Frame-Options"
  end

  def data_for_oembed_track(track)
    url = "#{private_embed_url(track.signed_id)}"
    {
      version: 1,
      type: "rich",
      provider_name: "Rauversion",
      provider_url: root_url,
      height: 450,
      width: "100%",
      title: "#{track.title} by #{track.user.username}",
      description: track.description,
      thumbnail_url: track.cover_url(:medium),
      html: track.iframe_code_string(url),
      author_name: track.user.username,
      author_url: user_url(track.user)
    }
  end

  def data_for_oembed_playlist(playlist)
    url = "#{playlist_private_embed_url(playlist.signed_id)}"
    {
      version: 1,
      type: "rich",
      provider_name: "Rauversion",
      provider_url: root_url,
      height: 450,
      width: "100%",
      title: "#{playlist.title} by #{playlist.user.username}",
      description: playlist.description,
      thumbnail_url: playlist.cover_url(:medium),
      html: playlist.iframe_code_string(url),
      author_name: playlist.user.username,
      author_url: user_url(playlist.user)
    }
  end
end
