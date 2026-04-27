class TracksController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show, :private_access, :appears_on]
  before_action :check_activated_account, only: [:new, :create, :update, :delete]

  layout :layout_by_resource

  def by_id
    ids = params[:ids].to_s.split(",")
    @tracks = Track
      .where(id: ids)
      .with_attached_cover
      .includes(
        user: { avatar_attachment: :blob },
        artists: { avatar_attachment: :blob }
      )

    respond_to do |format|
      format.json
    end
  end

  def index
    discovery = TracksDiscoveryQuery.new(
      scope: Track.published,
      params: discovery_params
    ).call

    @tracks = discovery[:tracks]
    @facets = discovery[:facets]
    @discovery_sections = discovery[:discovery_sections]
    @active_filters = discovery[:active_filters]
    @meta = discovery[:meta]
    @popular_tags = @facets[:tags]

    @labels = User.where(label: true).order("id desc").limit(10)

    @artists = User.featured_artists.limit(5)

    @highlighted_playlist = Playlist.published
      .includes(:releases)
      .where(playlist_type: ["ep", "album"])
      .order("editor_choice_position asc, release_date desc")
      .first
      
    respond_to do |format|
      format.html {render_blank}
      format.turbo_stream
      format.json
    end
  end

  def new
    # @track = current_user.tracks.new
    # @track.step = "upload"
    @track_form = TrackBulkCreator.new
    @track_form.step = "upload"
    @track_form.private = true
  end

  def create
    @track_form = TrackBulkCreator.new
    @track_form.step = track_bulk_params[:step]

    if @track_form.step == "upload"
      audios = track_bulk_params["audio"].select { |o| o.is_a?(String) }.reject(&:empty?)
      # @track = current_user.tracks.new(track_params)
      @track_form.user = current_user

      @track_form.tracks_attributes = audios.map { |o| 
        {
          private: ActiveRecord::Type::Boolean.new.cast(track_bulk_params[:private]),
          audio: o
        } 
      }
      @track_form.step = "info"
    else
      @track_form.tracks_attributes_objects = track_bulk_params[:tracks_attributes]
      @track_form.user = current_user
      @track_form.make_playlist = track_bulk_params[:make_playlist]
      @track_form.playlist_title = track_bulk_params[:playlist_title]
      @track_form.playlist_type = track_bulk_params[:playlist_type]
      @track_form.playlist_private = track_bulk_params[:playlist_private]
      @track_form.save
      if @track_form.errors.blank?
        @track_form.step = "share"
        
        respond_to do |format|
          format.html { redirect_to track_path(@track_form.tracks.first) }
          format.json
        end
      else
        respond_to do |format|
          format.html {render_blank}
          format.json
        end
      end
    end
  end

  def edit
    @track = current_user.tracks.friendly.find(params[:id])
    @tab = params[:tab] || "basic-info-tab"
    @track.tab = @tab
  end

  def update
    @track = current_user.tracks.friendly.find(params[:id])
    @tab = params[:track][:tab] || "basic-info-tab"
    media_reprocess_requested = params[:track][:audio].present? || params[:track][:video].present?
    @track.assign_attributes(track_params)
    if params[:track][:artist_ids]
      @track.artist_ids = params[:track][:artist_ids].reject(&:blank?)
    end

    if params[:nonpersist]
      @track.valid?
    else
      @track.label_id = label_user.id if !label_user.blank? && @track.enable_label
      if @track.save
        @track.reprocess_async if media_reprocess_requested
        flash.now[:notice] = "Track was successfully updated."
      else
        flash.now[:error] = @track.errors.full_messages
      end
    end
    # puts @track.errors.as_json
    @track.tab = @tab
  end

  def private_access
    @track = Track.find_signed(params[:id])
    get_meta_tags
    render "show"
  end

  def show
    load_track_for_show
    get_meta_tags

    respond_to do |format|
      format.html {render_blank}
      format.json
    end
  end

  def appears_on
    load_track_for_show
    @playlists = visible_playlists_for(@track)

    respond_to do |format|
      format.json
    end
  end

  def destroy
    @track = current_user.tracks.friendly.find(params[:id])
    @track.destroy
    head :no_content
  end

  def get_meta_tags
    @supporters = []
    set_meta_tags(
      # title: @track.title,
      # description: @track.description,
      keywords: @track.tags.join(", "),
      # url: Routes.articles_show_url(socket, :show, track.id),
      title: "#{@track.title} on Rauversion",
      description: "Stream #{@track.title} by #{@track.user.username} on Rauversion.",
      image: @track&.cover_url(:small),
      "twitter:player": track_embed_url(@track),
      twitter: {
        card: "player",
        player: {
          stream: @track.mp3_audio&.url,
          "stream:content_type": "audio/mpeg",
          width: 290,
          height: 58
        }
      }
    )

    @oembed_json = !@track.private? ?
      oembed_show_url(track_id: @track, format: :json)
      :  private_oembed_track_url(track_id: @track.signed_id, format: :json)


  end

  private

  def load_track_for_show
    track = Track.friendly.find(params[:id])
    @user = track.user
    @track = User.track_preloaded_by_user(
      current_user_id: current_user&.id,
      user: @user
    ).friendly.find(params[:id])
  end

  def visible_playlists_for(track)
    playlists = track.playlists
      .includes(:user, :track_playlists, cover_attachment: :blob)

    playlists = if current_user.present?
      playlists.where(
        "playlists.private = ? OR playlists.private IS NULL OR playlists.user_id = ?",
        false,
        current_user.id
      )
    else
      playlists.where(private: [false, nil])
    end

    release_types = %w[album ep single compilation]

    playlists.to_a
      .uniq(&:id)
      .sort_by do |playlist|
        [
          release_types.include?(playlist.playlist_type.to_s) ? 0 : 1,
          playlist.release_date.present? ? -playlist.release_date.to_date.jd : Float::INFINITY,
          -playlist.created_at.to_i
        ]
      end
  end

  def track_params
    params.require(:track).permit(
      :private,
      :enable_label,
      :audio, :title, :step, :description,
      :tab, :genre, :contains_music, :artist, :publisher, :isrc,
      :composer, :release_title, :buy_link, :album_title,
      :record_label, :release_date, :barcode,
      :iswc, :p_line,
      :price, :name_your_price,
      :direct_download, :display_embed, :enable_comments,
      :display_comments, :display_stats, :include_in_rss,
      :offline_listening, :enable_app_playblack,
      :cover, :video,
      :podcast,
      :copyright, :attribution, :noncommercial, :copies,
      crop_data: [:x, :y, :width, :height],
      tags: [],
      artist_ids: []
    )
  end

  def check_activated_account
    redirect_to( root_path, notice: t("not_activated_account")) and return unless current_user.is_creator?
  end

  def track_bulk_params
    params.require(:track_form).permit(
      :make_playlist, 
      :playlist_title,
      :playlist_type,
      :playlist_private,
      :private,
      :enable_label,
      :step,
      audio: [], 
      tracks_attributes: [
        :audio, :cover, :title, :description, :private, tags: []
      ]
    )
  end

  def discovery_params
    params.permit(
      :q,
      :tag,
      :genre,
      :mood,
      :subgenre,
      :language,
      :vocal_mode,
      :tempo_band,
      :min_bpm,
      :max_bpm,
      :sort,
      :page,
      :per_page
    )
  end
end
