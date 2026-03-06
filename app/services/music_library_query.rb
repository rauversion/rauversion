require "set" unless defined?(Set)

class MusicLibraryQuery
  FILTERS = %w[all playlists albums artists likes].freeze
  SORTS = %w[recent recently_added alphabetical creator].freeze
  ALBUM_TYPES = %w[album ep single compilation].freeze
  DEFAULT_PER_PAGE = 8
  MAX_PER_PAGE = 24

  def initialize(user:, filter: nil, sort: nil, page: nil, per: nil)
    @user = user
    @filter = FILTERS.include?(filter.to_s) ? filter.to_s : "all"
    @sort = SORTS.include?(sort.to_s) ? sort.to_s : "recent"
    @page = [page.to_i, 1].max
    @per = normalize_per_page(per)
  end

  def call
    paginated_collection = Kaminari.paginate_array(sorted_entries).page(page).per(per)

    {
      filter: filter,
      sort: sort,
      collection: paginated_collection,
      counts: counts,
      metadata: pagination_metadata(paginated_collection)
    }
  end

  private

  attr_reader :filter, :page, :per, :sort, :user

  def normalize_per_page(value)
    per_page = value.to_i
    return DEFAULT_PER_PAGE if per_page <= 0

    [per_page, MAX_PER_PAGE].min
  end

  def filtered_entries
    case filter
    when "playlists"
      playlist_entries
    when "albums"
      album_entries
    when "artists"
      artist_entries
    when "likes"
      liked_entries
    else
      all_entries
    end
  end

  def sorted_entries
    @sorted_entries ||= sort_entries(filtered_entries)
  end

  def counts
    {
      all: all_entries.size,
      playlists: playlist_entries.size,
      albums: album_entries.size,
      artists: artist_entries.size,
      likes: liked_entries.size
    }
  end

  def all_entries
    @all_entries ||= liked_entries + playlist_entries + album_entries + artist_entries
  end

  def sort_entries(entries)
    entries.sort_by { |entry| sort_key_for(entry) }
  end

  def sort_key_for(entry)
    case sort
    when "alphabetical"
      [entry[:title].to_s.downcase, creator_value(entry), -(entry[:sort_timestamp] || 0)]
    when "creator"
      [creator_value(entry), entry[:title].to_s.downcase, -(entry[:sort_timestamp] || 0)]
    when "recently_added"
      [-(entry[:added_timestamp] || 0), entry_priority(entry[:entity_type]), entry[:title].to_s.downcase]
    else
      [entry_priority(entry[:entity_type]), -(entry[:sort_timestamp] || 0), entry[:title].to_s.downcase]
    end
  end

  def creator_value(entry)
    value = entry[:creator_name].presence || entry[:owner_name].presence || entry[:title].to_s
    value.to_s.downcase
  end

  def entry_priority(entity_type)
    case entity_type
    when "likes"
      0
    when "playlist", "album"
      1
    else
      2
    end
  end

  def playlist_entries
    @playlist_entries ||= plain_playlists.map do |playlist|
      serialize_playlist(playlist, "playlist")
    end
  end

  def album_entries
    @album_entries ||= album_playlists.map do |playlist|
      serialize_playlist(playlist, "album")
    end
  end

  def liked_entries
    @liked_entries ||= begin
      tracks = liked_tracks

      if tracks.empty?
        []
      else
        [{
          id: "likes-tracks",
          entity_id: "likes-tracks",
          entity_type: "likes",
          title: "Tus me gusta",
          subtitle: nil,
          description: nil,
          href: "/library/likes",
          image_url: nil,
          artwork_style: "gradient",
          owner_name: user.username,
          creator_name: user.username,
          playlist_type: "likes",
          track_count: tracks.size,
          playlist_count: 0,
          playable: tracks.any?,
          track_ids: tracks.map { |track| track.id.to_s },
          primary_track_id: tracks.first&.id&.to_s,
          sort_timestamp: Time.current.to_i + 1,
          added_timestamp: liked_track_added_timestamp
        }]
      end
    end
  end

  def artist_entries
    @artist_entries ||= begin
      artist_stats.values.map do |entry|
        entry[:playlist_count] = entry.delete(:playlist_ids).size
        entry[:subtitle] = entry[:username].presence
        entry
      end.sort_by do |entry|
        [-entry[:playlist_count], -entry[:track_count], entry[:title].to_s.downcase]
      end
    end
  end

  def artist_stats
    @artist_stats ||= begin
      stats = {}
      playlist_ids = library_playlists.map(&:id)

      library_tracks.each do |track|
        track_playlist_ids = track.track_playlists.map(&:playlist_id) & playlist_ids
        next if track_playlist_ids.empty?

        ([track.user] + track.artists.to_a).compact.uniq.each do |artist|
          stats[artist.id] ||= serialize_artist(artist)
          stats[artist.id][:track_count] += 1
          track_playlist_ids.each do |playlist_id|
            stats[artist.id][:playlist_ids] << playlist_id
          end
          stats[artist.id][:sort_timestamp] = [stats[artist.id][:sort_timestamp], track.updated_at.to_i].max
        end
      end

      stats
    end
  end

  def serialize_artist(artist)
    {
      id: "artist-#{artist.id}",
      entity_id: artist.id,
      entity_type: "artist",
      title: artist.full_name.presence || artist.username.presence || "Artista ##{artist.id}",
      subtitle: nil,
      description: nil,
      href: artist.username.present? ? "/#{artist.username}" : nil,
      image_url: artist.avatar_url(:medium),
      artwork_style: "circle",
      owner_name: nil,
      creator_name: artist.full_name.presence || artist.username,
      username: artist.username,
      playlist_type: nil,
      track_count: 0,
      playlist_count: 0,
      playable: false,
      track_ids: [],
      primary_track_id: nil,
      sort_timestamp: 0,
      added_timestamp: 0,
      playlist_ids: Set.new
    }
  end

  def serialize_playlist(playlist, entity_type)
    ordered_track_ids = playlist.track_playlists.sort_by do |track_playlist|
      [track_playlist.position || 0, track_playlist.id]
    end.map { |track_playlist| track_playlist.track_id.to_s }

    {
      id: "#{entity_type}-#{playlist.id}",
      entity_id: playlist.id,
      entity_type: entity_type,
      title: playlist.title,
      subtitle: nil,
      description: playlist.description.presence,
      href: "/playlists/#{playlist.slug}",
      image_url: playlist.cover_url(:medium),
      artwork_style: "square",
      owner_name: playlist.user&.username,
      creator_name: playlist.user&.username,
      playlist_type: playlist.playlist_type.presence || "playlist",
      track_count: ordered_track_ids.size,
      playlist_count: 0,
      playable: ordered_track_ids.any?,
      track_ids: ordered_track_ids,
      primary_track_id: ordered_track_ids.first,
      sort_timestamp: playlist.updated_at.to_i,
      added_timestamp: playlist.created_at.to_i
    }
  end

  def plain_playlists
    @plain_playlists ||= library_playlists.select do |playlist|
      playlist.playlist_type.blank? || playlist.playlist_type == "playlist"
    end
  end

  def album_playlists
    @album_playlists ||= library_playlists.select do |playlist|
      ALBUM_TYPES.include?(playlist.playlist_type.to_s)
    end
  end

  def library_playlists
    @library_playlists ||= Playlist
      .where(user_id: user.id)
      .or(Playlist.where(label_id: user.id))
      .with_attached_cover
      .includes(:track_playlists, user: { avatar_attachment: :blob })
      .order(updated_at: :desc)
      .to_a
  end

  def library_tracks
    @library_tracks ||= Track
      .joins(:track_playlists)
      .where(track_playlists: { playlist_id: library_playlists.map(&:id) })
      .includes(:track_playlists, :artists, user: { avatar_attachment: :blob })
      .distinct
      .to_a
  end

  def liked_tracks
    @liked_tracks ||= begin
      liked_track_ids = Like
        .where(liker_type: "User", liker_id: user.id, likeable_type: "Track")
        .order(created_at: :desc)
        .pluck(:likeable_id)

      tracks_by_id = Track
        .where(id: liked_track_ids)
        .includes(user: { avatar_attachment: :blob }, artists: { avatar_attachment: :blob })
        .index_by(&:id)

      liked_track_ids.filter_map { |track_id| tracks_by_id[track_id] }
    end
  end

  def liked_track_added_timestamp
    @liked_track_added_timestamp ||= Like
      .where(liker_type: "User", liker_id: user.id, likeable_type: "Track")
      .maximum(:created_at)
      &.to_i || 0
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
