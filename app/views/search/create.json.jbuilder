json.users users do |user|
  json.partial! 'users/user', user: user, show_full_name: true
end

json.playlists playlists do |playlist|
  json.partial! 'playlists/playlist', playlist: playlist, show_cover: true
end

json.tracks tracks do |track|
  json.partial! 'tracks/track', track: track
end
