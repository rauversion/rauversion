json.id playlist.id
json.title playlist.title
json.slug playlist.slug
json.description playlist.description if defined?(show_description) && show_description
json.cover_url do
  json.medium playlist.cover_url(:medium)
  json.small playlist.cover_url(:small)
end
json.tracks_count playlist.tracks.size if defined?(show_tracks_count) && show_tracks_count
json.user do
  json.partial! 'users/user', user: playlist.user
end
