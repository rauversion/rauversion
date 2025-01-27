class PlaylistsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def index
    @playlists = Playlist.published.page(params[:page]).per(24)
    @playlists_by_type = @playlists.group_by(&:playlist_type)
  end

  def show
    if current_user
      begin
        @playlist = Playlist.where(user_id: current_user.id)
        .or(Playlist.where(label_id: current_user.id))
        .where(playlist_type: ["album", "ep"])
        .friendly.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        nil
      end
    end

    @playlist ||= Playlist.published.friendly.find(params[:id])
    @track = @playlist.tracks.first

    respond_to do |format|
      format.html do
        if turbo_frame_request?
          render partial: "playlist_widget", locals: { playlist: @playlist }
        else
          get_meta_tags
          render "show"
        end
      end
      format.json
    end
  end

  def edit
    @tab = params[:tab] || "basic-info-tab"
    @playlist = find_playlist
    @playlist.enable_label = @playlist.label_id.present?
  end

  def new
    @tab = params[:tab]
    @track = Track.friendly.find(params[:track_id])
    @playlist = current_user.playlists.new
    @playlist.track_playlists << TrackPlaylist.new(track: @track)
  end

  def create
    @tab = params[:tab] || "basic-info-tab"
    @playlist = current_user.playlists.create(playlist_params)
    if @playlist
      flash.now[:notice] = "successfully created"
    else
      flash.now[:error] = "error in creating"
    end
  end

  def update
    @tab = params[:tab] || "basic-info-tab"
    @playlist = find_playlist

    @playlist.assign_attributes(playlist_params)

    if !params[:nonpersist] && @playlist.save
      flash.now[:notice] = "successfully updated"
    else
      flash.now[:error] = "error updating playlist"
    end
  
    if params[:nonpersist]
      @playlist.assign_attributes(playlist_params)
    end
  end

  def destroy
  end

  def playlist_params
    params.require(:playlist).permit(
      :id,
      :title, :description, :private, :price,
      :playlist_type, :release_date, :cover,
      :record_label, :buy_link, :buy_link_title,
      :enable_label,
      :copyright,
      :name_your_price,
      :attribution, :noncommercial, :non_derivative_works, :copies,
      track_playlists_attributes: [
        :id,
        :_destroy,
        :track_id
      ]
    )
  end

  def sort
    @tab = params[:tab] || "tracks-tab"
    @playlist = current_user.playlists.friendly.find(params[:id])
    id = params.dig("section", "id")
    position = params.dig("section", "position")

    collection = @playlist.track_playlists.find(id)
    new_position = position-1
    new_position = new_position <= 0 ? 1 : new_position
    collection.insert_at(new_position)

    flash.now[:notice] = "successfully updated"

    render "update"

  end

  def find_playlist
    Playlist
      .where(user_id: current_user.id).or(Playlist.where(label_id: current_user.id))
      .friendly.find(params[:id])
  end


  def get_meta_tags
    @supporters = []
    set_meta_tags(
      # title: @track.title,
      # description: @track.description,
      keywords: @playlist.tags.join(", "),
      # url: Routes.articles_show_url(socket, :show, track.id),
      title: "#{@playlist.title} on Rauversion",
      description: "Stream #{@playlist.title} by #{@playlist.user.username} on Rauversion.",
      image: @playlist.cover_url(:small),
      "twitter:player": playlist_embed_url(@playlist),
      twitter: {
        card: "player",
        player: {
          stream: @playlist&.tracks&.first&.mp3_audio&.url,
          "stream:content_type": "audio/mpeg",
          width: 290,
          height: 58
        }
      }
    )

    @oembed_json = !@playlist.private? ?
    oembed_playlist_show_url(playlist_id: @playlist, format: :json)
      :  private_oembed_playlist_url(playlist_id: @playlist.signed_id, format: :json)


  end
end
