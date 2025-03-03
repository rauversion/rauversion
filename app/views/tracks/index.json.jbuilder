json.tracks @tracks do |track|
  json.id track.id
  json.title track.title
  json.slug track.slug
  json.description track.description
  json.price track.price
  json.price number_to_currency(track.price) unless track.price.nil?

  json.cover_url do
    if track.cover.attached?
      json.medium track.cover_url(:medium)
      json.small track.cover_url(:small)
    else
      json.medium track.user.avatar_url(:medium)
      json.small track.user.avatar_url(:small)
    end
  end
  json.user do
    json.id track.user.id
    json.username track.user.username
    json.avatar_url do
      json.medium track.user.avatar_url(:medium)
      json.small track.user.avatar_url(:small)
    end
  end
end

json.popular_tags @popular_tags do |tag|
  json.tag tag.tag
  json.count tag.count
end

json.artists @artists do |user|
  json.id user.id
  json.username user.username
  json.full_name user.full_name
  json.avatar_url do
    json.medium user.avatar_url(:medium)
    json.small user.avatar_url(:small)
  end
end

json.featured_albums Playlist.published.latests
  .includes(:releases, :user)
  .where(playlist_type: ["ep", "album"])
  .order("editor_choice_position asc, release_date desc, id desc")
  .limit(3) do |playlist|
    json.id playlist.id
    json.title playlist.title
    json.slug playlist.slug
    json.cover_url do
      json.medium playlist.cover_url(:medium)
      json.small playlist.cover_url(:small)
    end
    json.tracks_count playlist.tracks.size
    json.user do
      json.username playlist.user.username
      json.avatar_url do
        json.medium playlist.user.avatar_url(:medium)
        json.small playlist.user.avatar_url(:small)
      end
    end
end

json.curated_playlists Playlist.published.latests
  .includes(:releases, :user)
  .where(playlist_type: "playlist")
  .order("editor_choice_position asc, release_date desc, id desc")
  .limit(3) do |playlist|
    json.id playlist.id
    json.title playlist.title
    json.slug playlist.slug
    json.cover_url do
      json.medium playlist.cover_url(:medium)
      json.small playlist.cover_url(:small)
    end
    json.tracks_count playlist.tracks.size
    json.user do
      json.username playlist.user.username
      json.avatar_url do
        json.medium playlist.user.avatar_url(:medium)
        json.small playlist.user.avatar_url(:small)
      end
    end
end

json.labels @labels do |label|
  json.id label.id
  json.username label.username
  json.full_name label.full_name
  json.avatar_url do
    json.medium label.avatar_url(:medium)
    json.small label.avatar_url(:small)
  end
  json.playlists_count label.playlists.count
end

if @highlighted_playlist
  json.highlighted_playlist do
    json.id @highlighted_playlist.id
    json.title @highlighted_playlist.title
    json.slug @highlighted_playlist.slug
    json.description @highlighted_playlist.description
    json.cover_url do
      json.medium @highlighted_playlist.cover_url(:medium)
      json.small @highlighted_playlist.cover_url(:small)
    end
  end
end

json.meta do
  json.total_pages @tracks.total_pages
  json.current_page @tracks.current_page
  json.total_count @tracks.total_count
end
