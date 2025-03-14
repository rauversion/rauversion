json.collection @releases do |release|
  json.id release.id
  json.slug release.slug
  json.title release.title
  json.subtitle release.subtitle
  json.created_at release.created_at
  json.updated_at release.updated_at
  
  if release.cover.attached?
    json.cover_url do 
      json.medium rails_blob_url(release.cover.variant(resize_to_fill: [1200, 1200]))
      json.large rails_blob_url(release.cover.variant(resize_to_fill: [1200, 1200]))
    end
  end

  # json.playlists_count release.release_playlists.count
  # json.tracks_count release.release_playlists.joins(:playlist).sum('playlists.tracks_count')
  
  json.links do
    json.spotify release.spotify
    json.bandcamp release.bandcamp
    json.soundcloud release.soundcloud
  end

  json.urls do
    json.show release_path(release)
    json.edit edit_release_path(release)
    json.editor editor_release_path(release)
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @releases
end
