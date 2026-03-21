json.tracks @tracks do |track|
  json.partial! 'tracks/track', track: track
end

json.popular_tags @popular_tags do |tag|
  json.tag tag[:value]
  json.count tag[:count]
end unless @popular_tags.nil?

json.active_filters @active_filters || {}

json.facets do
  json.genres Array(@facets&.dig(:genres)) do |genre|
    json.value genre[:value]
    json.count genre[:count]
  end

  json.moods Array(@facets&.dig(:moods)) do |mood|
    json.value mood[:value]
    json.count mood[:count]
  end

  json.subgenres Array(@facets&.dig(:subgenres)) do |subgenre|
    json.value subgenre[:value]
    json.count subgenre[:count]
  end

  json.languages Array(@facets&.dig(:languages)) do |language|
    json.value language[:value]
    json.count language[:count]
  end

  json.tags Array(@facets&.dig(:tags)) do |tag|
    json.value tag[:value]
    json.count tag[:count]
  end

  json.tempo_bands Array(@facets&.dig(:tempo_bands)) do |band|
    json.key band[:key]
    json.label band[:label]
    json.min band[:min]
    json.max band[:max]
    json.count band[:count]
  end

  json.stats do
    json.analyzed_count @facets&.dig(:stats, :analyzed_count)
    json.bpm_min @facets&.dig(:stats, :bpm_min)
    json.bpm_max @facets&.dig(:stats, :bpm_max)
  end
end

json.discovery_sections do
  json.genres do
    json.title @discovery_sections&.dig(:genres, :title)
    json.items Array(@discovery_sections&.dig(:genres, :items)) do |section|
      json.value section[:value]
      json.count section[:count]
      json.tracks section[:tracks] do |track|
        json.partial! "tracks/track", track: track
      end
    end
  end

  json.moods do
    json.title @discovery_sections&.dig(:moods, :title)
    json.items Array(@discovery_sections&.dig(:moods, :items)) do |section|
      json.value section[:value]
      json.count section[:count]
      json.tracks section[:tracks] do |track|
        json.partial! "tracks/track", track: track
      end
    end
  end
end

json.artists @artists do |user|
  json.partial! 'users/user', user: user, show_full_name: true
end unless @artists.nil?

json.featured_albums Playlist.published.latests
  .with_attached_cover
  .includes(
    :releases,
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
  .where(playlist_type: ["ep", "album"])
  .order("editor_choice_position asc, release_date desc, id desc")
  .limit(3) do |playlist|
    json.partial! 'playlists/playlist', playlist: playlist, show_tracks_count: true
end

json.curated_playlists Playlist.published.latests
  .with_attached_cover
  .includes(
    :releases,
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
  .where(playlist_type: "playlist")
  .order("editor_choice_position asc, release_date desc, id desc")
  .limit(3) do |playlist|
    json.partial! 'playlists/playlist', playlist: playlist, show_tracks_count: true
end

json.labels @labels do |label|
  json.partial! 'labels/label', label: label
end unless @labels.nil?

if @highlighted_playlist
  json.highlighted_playlist do
    json.partial! 'playlists/playlist', playlist: @highlighted_playlist, show_description: true
  end
end unless @highlighted_playlist.nil?

json.meta do
  json.total_pages @meta&.dig(:total_pages) || @tracks.total_pages
  json.current_page @meta&.dig(:current_page) || @tracks.current_page
  json.total_count @meta&.dig(:total_count) || @tracks.total_count
  json.per_page @meta&.dig(:per_page)
end
