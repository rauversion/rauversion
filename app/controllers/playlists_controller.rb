class PlaylistsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show, :albums]

  def index
    
    respond_to do |format|
      format.html { render_blank }
      format.json {

        @playlists = Playlist.published
        .with_attached_cover
        .includes(
          user: { avatar_attachment: :blob },
          track_playlists: {
            track: [
              { user: { avatar_attachment: :blob } },
              { artists: { avatar_attachment: :blob } },
              { cover_attachment: :blob },
              { mp3_audio_attachment: :blob }
            ]
          }
        )
        .where.not(playlist_type: [nil, "podcast"])
        .order(id: :desc)

        @playlists = @playlists.where(playlist_type: params[:type]) if params[:type].present? && params[:type] != "all"
        
        if params[:term].present?
          @q = @playlists.ransack(title_cont: params[:term])
          @playlists = @q.result
        end
        
        @playlists = @playlists.page(params[:page]).per(24)
        # @playlists_by_type = @playlists.group_by(&:playlist_type)
      }
    end
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

    render status: 404, plain: "This playlist is private or not found" and return unless @playlist

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
    respond_to do |format|
      format.html
      format.json
    end
  end

  def new
    @playlist = Playlist.new
    @track = Track.find(params[:track_id]) if params[:track_id]
    @tab = params[:tab] || "create"

    respond_to do |format|
      format.html
      format.json {
        @playlists = Playlist.list_playlists_by_user_with_track(params[:track_id], current_user.id)
        render json: {
          playlists: @playlists.map { |p| 
            {
              id: p.id,
              title: p.title,
              track_count: p.tracks.count,
              has_track: p.track_playlists.exists?(track_id: params[:track_id])
            }
          }
        }
      }
    end
  end

  def create
    @playlist = current_user.playlists.new(playlist_params)
    
    respond_to do |format|
      if @playlist.save
        # Add track to playlist if track_ids are provided
        if params[:playlist][:track_ids].present?
          params[:playlist][:track_ids].each do |track_id|
            @playlist.track_playlists.create(track_id: track_id)
          end
        end

        format.html { redirect_to @playlist, notice: 'Playlist was successfully created.' }
        format.json { render :show, status: :created, location: @playlist }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @playlist.errors, status: :unprocessable_entity }
      end
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

    respond_to do |format|
      format.html
      format.json
    end
  end

  def destroy
  end

  def sort
    @tab = params[:tab] || "tracks-tab"
    @playlist = current_user.playlists.friendly.find(params[:id])
    
    positions = params[:positions]
    
    if positions.present?
      ActiveRecord::Base.transaction do
        positions.each do |position_data|
          track_playlist = @playlist.track_playlists.find(position_data[:id])
          track_playlist.insert_at(position_data[:position].to_i)
        end
      end
    end

    respond_to do |format|
      format.html { render :update }
      format.json { render json: { status: 'success', message: 'Playlist updated successfully' } }
    end
  end


  def albums
    base_query = Playlist
      .where(playlist_type: ["album", "ep"])
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
      .includes(tracks: {cover_attachment: :blob})

    if params[:ids].present?
      @playlists = base_query.where(id: params[:ids].split(",")).limit(50)
    else
      @playlists = base_query.ransack(title_cont: params[:q]).result
      @playlists = @playlists.page(params[:page]).per(10)
    end

    respond_to do |format|
      format.json { render :albums }
    end
  end

  private

  def playlist_params
    params.require(:playlist).permit(:title, :description, :playlist_type, :private, :price,
      :release_date, :cover,
      :record_label, :buy_link, :buy_link_title,
      :enable_label,
      :copyright,
      :name_your_price,
      :attribution, :noncommercial, :non_derivative_works, :copies,
      crop_data: [:x, :y, :width, :height],
      track_playlists_attributes: [
        :id,
        :_destroy,
        :track_id
      ],
      :track_ids => []
    )
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
