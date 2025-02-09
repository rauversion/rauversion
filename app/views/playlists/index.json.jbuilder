json.playlists @playlists do |playlist|
  json.id playlist.id
  json.title playlist.title
  json.description playlist.description
  json.slug playlist.slug
  json.playlist_type playlist.playlist_type
  json.private playlist.private
  json.release_date playlist.release_date
  json.editor_choice_position playlist.editor_choice_position
  json.created_at playlist.created_at
  json.updated_at playlist.updated_at

  json.user do
    json.id playlist.user.id
    json.username playlist.user.username
    json.avatar_url do
      json.small playlist.user.avatar_url(:small)
      json.medium playlist.user.avatar_url(:medium)
      json.large playlist.user.avatar_url(:large)
    end if playlist.user
    json.bio playlist.user.bio
  end

  json.cover_url do
    if playlist.cover.attached?
      json.small playlist.cover_url(:small)
      json.medium playlist.cover_url(:medium)
      json.large playlist.cover_url(:large)
    else
      json.small "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
      json.medium "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
      json.large "/daniel-schludi-mbGxz7pt0jM-unsplash-sqr-s-bn.png"
    end
  end

  json.tracks playlist.tracks do |track|
    json.id track.id
    json.title track.title
    json.slug track.slug
    json.duration track.duration
    json.created_at track.created_at
  end
end

json.meta do
  json.current_page @playlists.current_page
  json.total_pages @playlists.total_pages
  json.total_count @playlists.total_count
  json.per_page @playlists.limit_value
end
