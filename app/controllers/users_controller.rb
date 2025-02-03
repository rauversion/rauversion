class UsersController < ApplicationController
  before_action :find_user, except: [:index, :stats]
  before_action :check_user_role, except: [:index]

  def index
    @title = "Tracks"
    @artists = User.where(role: "artist")
      .where.not(username: nil)
      .order("id desc")
    q = params[:q]
    if q.present?
      @artists = @artists.where("username ILIKE :q OR email ILIKE :q OR first_name ILIKE :q OR last_name ILIKE :q", q: "%#{q}%")
    end
    @artists = @artists.page(params[:page]).per(5)

    respond_to do |format|
      format.html
      format.json
    end
  end

  def show
    @title = "All"
    get_tracks
    get_playlists
    get_meta_tags
    @as = :track
    @section = "tracks/track_item"
    @collection = @tracks
    respond_to do |format|
      format.html # show.html.erb
      format.json # show.json.jbuilder
    end
  end

  def tracks
    @title = "Tracks"
    @tracks = @user.tracks
      .with_attached_cover
      .includes(user: { avatar_attachment: :blob })
      .order(created_at: :desc)
      .page(params[:page])
      .per(12)

    @collection = @tracks
    respond_to do |format|
      format.html do
        @as = :track
        @section = "tracks/track_item"
        paginated_render
      end
      format.json
    end
  end

  def playlists_filter

    @kind = params[:kind].present? ? params[:kind].split(",") : Category.playlist_types
    
    @playlists = Playlist
      .where(playlist_type: @kind)
      .where(user_id: @user.id).or(Playlist.where(label_id: @user.id))
      .where(private: false)
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
      .includes(tracks: {cover_attachment: :blob})

    if current_user.blank? || current_user != @user
      @playlists = @playlists.where(private: false)
    end

    @render_empty = true if params[:kind].blank? && @playlists.empty?

    @playlists = @playlists.page(params[:page]).per(5)

    respond_to do |format|
      format.html { render "playlist_cards" }
      format.json
    end
  end

  def playlists
    @title = "Playlists"
    @section = "playlists"
    @collection = Playlist
    .where(user_id: @user.id).or(Playlist.where(label_id: @user.id))
    .where.not(playlist_type: ["album", "ep"])
    .with_attached_cover
    .includes(user: {avatar_attachment: :blob})
    .includes(tracks: {cover_attachment: :blob})

    if current_user.blank? || current_user != @user
      @collection = @collection.where(private: false)
    end

    @collection = @collection.references(:tracks)
    .page(params[:page])
    .per(5)

    respond_to do |format|
      format.html do
        @as = :playlist
        @section = "playlists/playlist_item"
        paginated_render
      end
      format.json
    end
  end

  def artists
    @label = User.where(role: ["artist", "admin"], label: true).find_by(username: params[:user_id])
    @collection = @label.child_accounts.page(params[:page]).per(50) #    connected_accounts.page(params[:page]).per(5)
    @as = :artist
    @section = "label_artists/artist"
    @title = "Artists"
    @cta_url = new_account_connection_path
    @cta_label = "New account connection"
    @collection_class = "mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 md:gap-y-0 lg:gap-x-8"
    @admin = current_user && current_user.id == @label&.id

    respond_to do |format|
      format.html { render "show" }
      format.json
    end
  end

  def reposts
    @title = "Reposts"
    @collection = @user.reposts_preloaded.page(params[:page]).per(5)
    @as = :track
    @section = "tracks/track_item"

    respond_to do |format|
      format.html { render "show" }
      format.json
    end
  end

  def albums
    @title = "Albums"
    @section = "albums"
    @collection = Playlist
      .where(user_id: @user.id)
      .or(Playlist.where(label_id: @user.id))
      .where(playlist_type: ["album", "ep"])
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
      .includes(tracks: {cover_attachment: :blob})
      .order(created_at: :desc)

    if current_user.blank? || current_user != @user
      @collection = @collection.where(private: false)
    end

    @collection = @collection.ransack(title_cont: params[:q]).result if params[:q].present?
    @collection = @collection.page(params[:page]).per(12)

    respond_to do |format|
      format.html do
        @as = :playlist
        @namespace = :album
        @section = "playlists/playlist_item"
        paginated_render
      end
      format.json { render "playlists" }
    end
  end

  def about
    respond_to do |format|
      format.html
      format.json
    end
  end

  def articles
    @articles = @user.posts.order("id desc").page(params[:page]).per(params[:per] || 10)

    respond_to do |format|
      format.html { render "articles" }
      format.json
    end
  end

  def stats
    @user = User.friendly.find(params[:username])
    @stats = {
      followers_count: @user.followers(User).size,
      monthly_listeners: Track.series_by_month(@user.id, range: 1).first&.fetch(:count, 0),
      top_countries: Track.top_countries(@user.id)
    }

    respond_to do |format|
      format.json
    end
  end

  private

  def get_meta_tags
    set_meta_tags(
      # keywords: @user.tags.join(", "),
      # url: Routes.articles_show_url(socket, :show, track.id),
      title: "#{@user.username} on Rauversion",
      description: "Stream #{@user.username} on Rauversion.",
      image: @user.avatar_url(:small)
    )
  end

  def get_tracks
    @tracks = @user.tracks
      .with_attached_cover
      .includes(user: { avatar_attachment: :blob })
      .order(created_at: :desc)
      .page(params[:page])
      .per(12)
  end

  def get_playlists
    @playlists = Playlist
      .where(user_id: @user.id)
      .or(Playlist.where(label_id: @user.id))
      .where(private: false)
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
      .includes(tracks: {cover_attachment: :blob})
      .order(created_at: :desc)
  end

  def find_user
    @user = User.find_by(username: params[:id] || params[:user_id])
  end

  def paginated_render
    unless params[:page]
      render "show"
    end

    if params[:page]
      render turbo_stream: [
        turbo_stream.prepend(
          "paginated-list",
          partial: @section,
          collection: @collection,
          as: @as
        ),
        turbo_stream.replace(
          "list-pagination",
          partial: "item_pagination"
        )
      ]
    end
  end

  def check_user_role
    redirect_to root_url, notice: "The profile you are trying to access is not activated" and return unless @user.is_creator?
  end
end
