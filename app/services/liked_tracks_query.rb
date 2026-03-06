class LikedTracksQuery
  ALBUM_TYPES = %w[album ep single compilation].freeze
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 50

  def initialize(user:, page: nil, per: nil)
    @user = user
    @page = [page.to_i, 1].max
    @per = normalize_per_page(per)
  end

  def call
    paginated_likes = likes_scope.page(page).per(per)
    ordered_track_ids = paginated_likes.pluck(:likeable_id)

    tracks_by_id = Track
      .where(id: ordered_track_ids)
      .with_attached_cover
      .includes(
        :track_playlists,
        :playlists,
        user: { avatar_attachment: :blob },
        artists: { avatar_attachment: :blob }
      )
      .index_by(&:id)

    ordered_tracks = ordered_track_ids.filter_map { |track_id| tracks_by_id[track_id] }
    liked_at_by_track_id = paginated_likes.index_by(&:likeable_id).transform_values(&:created_at)

    {
      liked_playlist: {
        title: "Tus me gusta",
        description: "Tus canciones favoritas guardadas en Rauversion.",
        username: user.username,
        tracks_count: likes_scope.count
      },
      collection: ordered_tracks.map { |track| serialize_track(track, liked_at_by_track_id[track.id]) },
      metadata: pagination_metadata(paginated_likes)
    }
  end

  private

  attr_reader :page, :per, :user

  def normalize_per_page(value)
    per_page = value.to_i
    return DEFAULT_PER_PAGE if per_page <= 0

    [per_page, MAX_PER_PAGE].min
  end

  def likes_scope
    @likes_scope ||= Like
      .where(liker_type: "User", liker_id: user.id, likeable_type: "Track")
      .order(created_at: :desc)
  end

  def serialize_track(track, liked_at)
    {
      id: track.id,
      slug: track.slug,
      title: track.title,
      duration: track.duration,
      liked_at: liked_at,
      album_title: album_title_for(track),
      url: "/tracks/#{track.slug}",
      cover_url: {
        small: track.cover_url(:small),
        medium: track.cover_url(:medium),
        large: track.cover_url(:large),
        cropped_image: track.cover_url(:medium)
      },
      user: {
        id: track.user.id,
        username: track.user.username,
        full_name: track.user.full_name,
        avatar_url: {
          small: track.user.avatar_url(:small),
          medium: track.user.avatar_url(:medium)
        }
      },
      artists: track.artists.map do |artist|
        {
          id: artist.id,
          username: artist.username,
          full_name: artist.full_name,
          avatar_url: {
            small: artist.avatar_url(:small),
            medium: artist.avatar_url(:medium)
          }
        }
      end
    }
  end

  def album_title_for(track)
    track.album_title.presence ||
      track.playlists.find { |playlist| ALBUM_TYPES.include?(playlist.playlist_type.to_s) }&.title
  end

  def pagination_metadata(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      next_page: collection.next_page,
      prev_page: collection.prev_page,
      is_first_page: collection.first_page?,
      is_last_page: collection.last_page?,
      total_count: collection.total_count
    }
  end
end
