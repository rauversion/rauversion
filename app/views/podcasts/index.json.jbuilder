json.collection @collection do |track|
  json.partial! 'tracks/track', track: track
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
