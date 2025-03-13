json.tracks @tracks do |track|
  json.partial! 'tracks/track', track: track
end
