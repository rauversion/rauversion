json.tracks @tracks do |track|
  json.partial! 'tracks/track', track: track
end

json.meta do
  json.total_pages @tracks.total_pages
  json.current_page @tracks.current_page
  json.total_count @tracks.total_count
end
