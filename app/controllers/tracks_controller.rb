class TracksController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show, :private_access]
  before_action :check_activated_account, only: [:new, :create, :update, :delete]
  def index
    @tracks = Track.published.order("id desc")
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})

    # Filter by tag if present
    @tracks = @tracks.where('? = ANY(tags)', params[:tag]) if params[:tag].present?
    
    @tracks = @tracks.page(params[:page]).per(12)
    
    @popular_tags = Track.published
      .where.not(tags: [])
      .select('unnest(tags) as tag, count(*) as count')
      .group('unnest(tags)')
      .order('count DESC')
      .limit(10)

    @labels = User.where(label: true).order("id desc").limit(10)

    @artists = User.where(role: "artist")
      .where.not(username: nil)
      .order("id desc")
      .limit(3)

    @highlighted_playlist = Playlist.published
      .includes(:releases)
      .where(playlist_type: ["ep", "album"])
      .order("editor_choice_position asc, release_date desc")
      .first

    respond_to do |format|
      format.html
      format.turbo_stream
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
      @track_form.save
      if @track_form.errors.blank?
        @track_form.step = "share"
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
    @track.assign_attributes(track_params)
    if params[:nonpersist]
      @track.valid?
    else
      @track.label_id = label_user.id if !label_user.blank? && @track.enable_label
      if @track.save
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
    @track = Track.friendly.find(params[:id])
    get_meta_tags
  end

  def destroy
    @track = current_user.tracks.friendly.find(params[:id])
    @track.destroy
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
      :cover,
      :podcast,
      :copyright, :attribution, :noncommercial, :copies,
      tags: []
    )
  end

  def check_activated_account
    redirect_to( root_path, notice: t("not_activated_account")) and return unless current_user.is_creator?
  end

  def track_bulk_params
    params.require(:track_bulk_creator).permit(
      :make_playlist, 
      :private,
      :enable_label,
      :step,
      audio: [], 
      tracks_attributes: [
        :audio, :cover, :title, :description, :private, tags: []
      ]
    )
  end
end
