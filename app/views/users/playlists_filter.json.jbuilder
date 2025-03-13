json.collection @playlists do |playlist|
  json.extract! playlist, :id, :title, :description, :playlist_type, :private, :slug, :created_at
  json.cover_url do
    json.small playlist.cover_url(:small)
    json.medium playlist.cover_url(:medium)
    json.large playlist.cover_url(:large)
  end
  json.tracks_count playlist.tracks.count
  json.user do
    json.partial! 'users/user', user: playlist.user, show_full_name: true
  end
end

json.filter do
  json.kind @kind
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @playlists
end
