json.collection @tracks do |track|
  json.peaks track.track_peak&.data || []
  json.partial! 'tracks/track', track: track
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
