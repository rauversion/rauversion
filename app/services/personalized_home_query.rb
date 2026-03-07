class PersonalizedHomeQuery
  QUICK_ACCESS_LIMIT = 8
  SECTION_ITEM_LIMIT = 8
  PODCAST_LIMIT = 8
  EVENT_LIMIT = 4
  RECENT_EVENT_LIMIT = 24
  PLAYLIST_CANDIDATE_LIMIT = 40
  PLAYLIST_FALLBACK_LIMIT = 16

  def initialize(user:)
    @user = user
  end

  def call
    {
      stats: {
        recent_listens_count: recent_listening_events.size,
        liked_tracks_count: liked_track_total_count,
        followed_artists_count: followed_artist_ids.size,
        upcoming_events_count: upcoming_events.size
      },
      quick_access: quick_access_items,
      sections: sections
    }
  end

  private

  attr_reader :user

  def sections
    [
      section_payload(
        id: "recently_played",
        title: t("sections.recently_played.title"),
        subtitle: t("sections.recently_played.subtitle"),
        category: "all",
        layout: "media",
        items: recently_played_items
      ),
      section_payload(
        id: "recommended_playlists",
        title: t("sections.recommended_playlists.title"),
        subtitle: t("sections.recommended_playlists.subtitle"),
        category: "music",
        layout: "media",
        href: "/playlists",
        items: recommended_playlists
      ),
      section_payload(
        id: "editor_choices",
        title: t("sections.editor_choices.title"),
        subtitle: t("sections.editor_choices.subtitle"),
        category: "music",
        layout: "media",
        href: "/playlists",
        items: editor_choice_items
      ),
      section_payload(
        id: "most_played_tracks",
        title: t("sections.most_played_tracks.title"),
        subtitle: t("sections.most_played_tracks.subtitle"),
        category: "music",
        layout: "media",
        href: "/tracks",
        items: most_played_tracks
      ),
      section_payload(
        id: "podcasts_for_you",
        title: t("sections.podcasts_for_you.title"),
        subtitle: t("sections.podcasts_for_you.subtitle"),
        category: "podcasts",
        layout: "media",
        items: podcasts_for_you
      ),
      section_payload(
        id: "upcoming_events",
        title: t("sections.upcoming_events.title"),
        subtitle: t("sections.upcoming_events.subtitle"),
        category: "events",
        layout: "event",
        href: "/events",
        items: upcoming_events
      )
    ].compact
  end

  def section_payload(id:, title:, subtitle:, category:, layout:, items:, href: nil)
    return if items.blank?

    {
      id: id,
      title: title,
      subtitle: subtitle,
      category: category,
      layout: layout,
      href: href,
      items: items
    }
  end

  def quick_access_items
    dedupe_items([
      liked_tracks_entry,
      *recently_played_items,
      *recommended_playlists,
      *editor_choice_items
    ].compact).first(QUICK_ACCESS_LIMIT)
  end

  def liked_tracks_entry
    return if liked_tracks.empty?

    {
      id: "likes-tracks",
      entity_type: "likes",
      title: t("library.likes.title"),
      subtitle: t("library.likes.saved_tracks", count: liked_track_total_count),
      description: t("library.likes.description"),
      href: "/library/likes",
      image_url: nil,
      image_style: "gradient",
      badge: t("badges.collection"),
      meta: t("meta.tracks", count: liked_track_total_count),
      reason: t("reasons.your_favorites"),
      timestamp: liked_track_last_added_at&.iso8601,
      categories: ["music"],
      playable: liked_tracks.any?,
      primary_track_id: liked_tracks.first&.id&.to_s,
      track_ids: liked_tracks.map { |track| track.id.to_s }
    }
  end

  def recently_played_items
    @recently_played_items ||= dedupe_items(
      recent_listening_events.flat_map do |event|
        items = []

        if (playlist = recent_playlists_by_id[event.playlist_id])
          items << serialize_playlist(
            playlist,
            reason: t("reasons.recently_played"),
            timestamp: event.created_at
          )
        end

        if (track = recent_tracks_by_id[event.track_id])
          items << serialize_track(
            track,
            reason: t("reasons.recently_played"),
            timestamp: event.created_at
          )
        end

        items
      end
    ).first(SECTION_ITEM_LIMIT)
  end

  def recommended_playlists
    @recommended_playlists ||= begin
      ranked_items = candidate_playlists.filter_map do |playlist|
        score = recommendation_score_for(playlist)
        next if preference_signals_present? && score <= 0

        payload = serialize_playlist(
          playlist,
          reason: recommendation_reason_for(playlist),
          timestamp: playlist.release_date || playlist.updated_at
        )

        payload.merge(
          _score: score,
          _editor_rank: playlist.editor_choice_position || 99_999,
          _timestamp_rank: (playlist.release_date || playlist.updated_at || playlist.created_at)&.to_i.to_i
        )
      end

      if ranked_items.empty?
        sort_playlists_for_curators(candidate_playlists).first(SECTION_ITEM_LIMIT).map do |playlist|
          serialize_playlist(
            playlist,
            reason: playlist.editor_choice_position.present? ? t("reasons.curated_by_team") : t("reasons.discover_new"),
            timestamp: playlist.release_date || playlist.updated_at
          )
        end
      else
        ranked_items
          .sort_by { |item| [-item[:_score], item[:_editor_rank], -item[:_timestamp_rank]] }
          .first(SECTION_ITEM_LIMIT)
          .map { |item| item.except(:_score, :_editor_rank, :_timestamp_rank) }
      end
    end
  end

  def editor_choice_items
    @editor_choice_items ||= begin
      excluded_ids = recommended_playlists.map { |item| item[:entity_id] }.compact
      curated = editor_choice_playlists.reject { |playlist| excluded_ids.include?(playlist.id) }
      curated = editor_choice_playlists if curated.blank?

      curated.first(SECTION_ITEM_LIMIT).map do |playlist|
        serialize_playlist(
          playlist,
          reason: t("reasons.editor_choice"),
          timestamp: playlist.release_date || playlist.updated_at
        )
      end
    end
  end

  def most_played_tracks
    @most_played_tracks ||= begin
      rows = user.listening_events
        .where.not(track_id: nil)
        .group(:track_id)
        .select("track_id, COUNT(*) AS plays_count, MAX(created_at) AS last_played_at")
        .order(Arel.sql("plays_count DESC, last_played_at DESC"))
        .limit(SECTION_ITEM_LIMIT)

      tracks_by_id = Track.published
        .where(id: rows.map(&:track_id))
        .with_attached_cover
        .includes(
          user: { avatar_attachment: :blob },
          artists: { avatar_attachment: :blob }
        )
        .index_by(&:id)

      items = rows.filter_map do |row|
        track = tracks_by_id[row.track_id]
        next unless track

        serialize_track(
          track,
          meta: plays_label(row.read_attribute("plays_count").to_i),
          reason: t("reasons.on_repeat"),
          timestamp: row.read_attribute("last_played_at")
        )
      end

      items.presence || latest_music_tracks
    end
  end

  def podcasts_for_you
    @podcasts_for_you ||= begin
      preferred_creator_ids = recent_tracks_by_id.values
        .select(&:podcast?)
        .map(&:user_id)
        .concat(liked_tracks.select(&:podcast?).map(&:user_id))
        .uniq

      preferred_items = Track.published
        .podcasts
        .where(user_id: preferred_creator_ids)
        .with_attached_cover
        .includes(
          user: { avatar_attachment: :blob },
          artists: { avatar_attachment: :blob }
        )
        .order(id: :desc)
        .limit(PODCAST_LIMIT)
        .map do |track|
          serialize_track(
            track,
            reason: t("reasons.because_you_listen_to_this_podcast"),
            timestamp: track.created_at
          )
        end

      fallback_items = Track.published
        .podcasts
        .where.not(id: preferred_items.map { |item| item[:entity_id] })
        .with_attached_cover
        .includes(
          user: { avatar_attachment: :blob },
          artists: { avatar_attachment: :blob }
        )
        .order(id: :desc)
        .limit(PODCAST_LIMIT)
        .map do |track|
          serialize_track(
            track,
            reason: t("reasons.recommended_to_keep_listening"),
            timestamp: track.created_at
          )
        end

      dedupe_items(preferred_items + fallback_items).first(PODCAST_LIMIT)
    end
  end

  def upcoming_events
    @upcoming_events ||= begin
      followed = Event.public_events
        .upcoming
        .where(user_id: followed_artist_ids)
        .includes(:user)
        .with_attached_cover
        .limit(EVENT_LIMIT)
        .to_a

      fallback = Event.public_events
        .upcoming
        .where.not(id: followed.map(&:id))
        .includes(:user)
        .with_attached_cover
        .limit(EVENT_LIMIT)
        .to_a

      dedupe_items(
        followed.map { |event| serialize_event(event, reason: t("reasons.from_artists_you_follow")) } +
        fallback.map { |event| serialize_event(event, reason: t("reasons.upcoming_on_rauversion")) }
      ).first(EVENT_LIMIT)
    end
  end

  def latest_music_tracks
    Track.published
      .where.not(podcast: true)
      .with_attached_cover
      .includes(
        user: { avatar_attachment: :blob },
        artists: { avatar_attachment: :blob }
      )
      .order(id: :desc)
      .limit(SECTION_ITEM_LIMIT)
      .map do |track|
        serialize_track(
          track,
          reason: t("reasons.new_release"),
          timestamp: track.created_at
        )
      end
  end

  def recent_listening_events
    @recent_listening_events ||= user.listening_events
      .order(created_at: :desc)
      .limit(RECENT_EVENT_LIMIT)
      .to_a
  end

  def recent_tracks_by_id
    @recent_tracks_by_id ||= Track.published
      .where(id: recent_listening_events.map(&:track_id).compact.uniq)
      .with_attached_cover
      .includes(
        user: { avatar_attachment: :blob },
        artists: { avatar_attachment: :blob }
      )
      .index_by(&:id)
  end

  def recent_playlists_by_id
    @recent_playlists_by_id ||= Playlist.published
      .where(id: recent_listening_events.map(&:playlist_id).compact.uniq)
      .with_attached_cover
      .includes(:track_playlists, user: { avatar_attachment: :blob })
      .index_by(&:id)
  end

  def followed_artist_ids
    @followed_artist_ids ||= Follow
      .where(
        follower_type: "User",
        follower_id: user.id,
        followable_type: "User"
      )
      .order(created_at: :desc)
      .pluck(:followable_id)
      .uniq
  end

  def liked_track_scope
    @liked_track_scope ||= Like
      .where(liker_type: "User", liker_id: user.id, likeable_type: "Track")
      .order(created_at: :desc)
  end

  def liked_track_total_count
    @liked_track_total_count ||= liked_track_scope.count
  end

  def liked_track_last_added_at
    @liked_track_last_added_at ||= liked_track_scope.limit(1).pick(:created_at)
  end

  def liked_tracks
    @liked_tracks ||= begin
      ordered_ids = liked_track_scope.limit(SECTION_ITEM_LIMIT * 2).pluck(:likeable_id)
      tracks_by_id = Track.published
        .where(id: ordered_ids)
        .with_attached_cover
        .includes(
          user: { avatar_attachment: :blob },
          artists: { avatar_attachment: :blob }
        )
        .index_by(&:id)

      ordered_ids.filter_map { |track_id| tracks_by_id[track_id] }
    end
  end

  def candidate_playlists
    @candidate_playlists ||= begin
      excluded_ids = recent_playlists_by_id.keys

      playlists = Playlist.published
        .where(playlist_type: Playlist::Types.plain)
        .where.not(user_id: user.id)
        .where.not(id: excluded_ids)
        .with_attached_cover
        .includes(:track_playlists, user: { avatar_attachment: :blob })
        .limit(PLAYLIST_CANDIDATE_LIMIT)
        .to_a

      sort_playlists_for_curators(playlists)
    end
  end

  def editor_choice_playlists
    @editor_choice_playlists ||= begin
      playlists = Playlist.published
        .where(playlist_type: Playlist::Types.plain)
        .where.not(editor_choice_position: nil)
        .with_attached_cover
        .includes(:track_playlists, user: { avatar_attachment: :blob })
        .limit(PLAYLIST_FALLBACK_LIMIT)
        .to_a

      sort_playlists_for_curators(playlists)
    end
  end

  def sort_playlists_for_curators(playlists)
    playlists.sort_by do |playlist|
      [
        playlist.editor_choice_position.nil? ? 1 : 0,
        playlist.editor_choice_position || 99_999,
        -((playlist.release_date || playlist.updated_at || playlist.created_at)&.to_i || 0),
        -playlist.id.to_i
      ]
    end
  end

  def preference_signals_present?
    preference_tags.any? || preference_genres.any?
  end

  def preference_tags
    @preference_tags ||= begin
      tags = recent_tracks_by_id.values.flat_map(&:tags)
        .concat(liked_tracks.flat_map(&:tags))
        .concat(recent_playlists_by_id.values.flat_map(&:tags))

      normalize_terms(tags)
    end
  end

  def preference_genres
    @preference_genres ||= begin
      genres = recent_tracks_by_id.values.map(&:genre)
        .concat(liked_tracks.map(&:genre))
        .concat(recent_playlists_by_id.values.map(&:genre))

      normalize_terms(genres)
    end
  end

  def normalize_terms(values)
    values
      .flatten
      .map(&:to_s)
      .map(&:strip)
      .reject(&:blank?)
      .map(&:downcase)
      .tally
      .sort_by { |(_, count)| -count }
      .map(&:first)
      .first(6)
  end

  def recommendation_score_for(playlist)
    tags = normalize_terms(playlist.tags)
    genre = playlist.genre.to_s.strip.downcase

    tag_score = (tags & preference_tags).size * 3
    genre_score = genre.present? && preference_genres.include?(genre) ? 2 : 0
    editor_bonus = playlist.editor_choice_position.present? ? 1 : 0

    tag_score + genre_score + editor_bonus
  end

  def recommendation_reason_for(playlist)
    overlapping_tags = normalize_terms(playlist.tags) & preference_tags
    genre = playlist.genre.to_s.strip

    if overlapping_tags.any?
      t("reasons.because_listening_tags", terms: overlapping_tags.first(2).join(", "))
    elsif genre.present? && preference_genres.include?(genre.downcase)
      t("reasons.because_listening_genre", genre: genre)
    elsif playlist.editor_choice_position.present?
      t("reasons.curated_by_team")
    else
      t("reasons.discover_new")
    end
  end

  def serialize_track(track, reason:, timestamp:, meta: nil)
    {
      id: "track-#{track.id}",
      entity_id: track.id,
      entity_type: track.podcast? ? "podcast" : "track",
      title: track.title,
      subtitle: artist_names_for(track).presence || owner_name_for(track.user),
      description: track.description,
      href: "/tracks/#{track.slug}",
      image_url: track.cover_url(:medium),
      image_style: "square",
      badge: track.podcast? ? t("badges.podcast") : t("badges.track"),
      meta: meta || track_meta(track),
      reason: reason,
      timestamp: timestamp&.iso8601,
      categories: [track.podcast? ? "podcasts" : "music"],
      playable: track.mp3_audio.attached?,
      primary_track_id: track.id.to_s,
      track_ids: [track.id.to_s]
    }
  end

  def serialize_playlist(playlist, reason:, timestamp:)
    ordered_track_ids = playlist.track_playlists
      .sort_by { |track_playlist| [track_playlist.position || 0, track_playlist.id] }
      .map { |track_playlist| track_playlist.track_id.to_s }

    {
      id: "playlist-#{playlist.id}",
      entity_id: playlist.id,
      entity_type: playlist.album? ? "album" : "playlist",
      title: playlist.title,
      subtitle: owner_name_for(playlist.user),
      description: playlist.description,
      href: "/playlists/#{playlist.slug}",
      image_url: playlist.cover_url(:medium),
      image_style: "square",
      badge: playlist_badge_for(playlist),
      meta: playlist_meta(playlist, ordered_track_ids.size),
      reason: reason,
      timestamp: timestamp&.iso8601,
      categories: ["music"],
      playable: ordered_track_ids.any?,
      primary_track_id: ordered_track_ids.first,
      track_ids: ordered_track_ids
    }
  end

  def serialize_event(event, reason:)
    {
      id: "event-#{event.id}",
      entity_id: event.id,
      entity_type: "event",
      title: event.title,
      subtitle: owner_name_for(event.user),
      description: event.description,
      href: "/events/#{event.slug}",
      image_url: event.cover_url(:large),
      image_style: "square",
      badge: t("badges.event"),
      meta: event_date_label(event),
      secondary_meta: [event.city, event.venue].reject(&:blank?).join(" · "),
      reason: reason,
      timestamp: event.event_start&.iso8601,
      categories: ["events"],
      playable: false,
      primary_track_id: nil,
      track_ids: []
    }
  end

  def owner_name_for(owner)
    return unless owner

    owner.full_name.presence || owner.username
  end

  def artist_names_for(track)
    track.artists
      .map { |artist| owner_name_for(artist) }
      .reject(&:blank?)
      .first(2)
      .join(", ")
  end

  def track_meta(track)
    return track.genre if track.genre.present?
    return track.tags.first if track.tags.any?

    track.podcast? ? owner_name_for(track.user) : t("meta.new_track")
  end

  def playlist_meta(playlist, track_count = nil)
    count = track_count || playlist.track_playlists.size
    base = playlist_type_label(playlist)

    t("meta.playlist_summary", type: base, count: count)
  end

  def playlist_badge_for(playlist)
    playlist_type_label(playlist)
  end

  def playlist_type_label(playlist)
    if playlist.album?
      t("playlist_types.#{playlist.playlist_type}", default: playlist.playlist_type.to_s.upcase)
    else
      t("badges.playlist")
    end
  end

  def event_date_label(event)
    return if event.event_start.blank?

    I18n.l(event.event_start, format: "%d %b · %H:%M")
  rescue I18n::ArgumentError
    event.event_start.strftime("%d %b · %H:%M")
  end

  def plays_label(count)
    t("meta.plays", count: count)
  end

  def dedupe_items(items)
    seen = {}

    items.each_with_object([]) do |item, collection|
      next if item.blank? || seen[item[:id]]

      seen[item[:id]] = true
      collection << item
    end
  end

  def t(key, **options)
    I18n.t("home.personalized.#{key}", **options)
  end
end
