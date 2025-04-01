json.id spotlight.id
json.position spotlight.position

json.track do
  json.partial! 'tracks/track', track: spotlight.spotlightable

end
