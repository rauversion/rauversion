json.collection @tracks do |track|
  json.extract! track, :id, :title, :description, :duration, :slug, :created_at
  json.peaks track.track_peak&.data || []
  json.audio_url url_for(track.mp3_audio) if track.mp3_audio.attached?
  json.cover_url do
    json.small track.cover_url(:small)
    json.medium track.cover_url(:medium)
    json.large track.cover_url(:large)
  end
  json.user do
    json.extract! track.user, :id, :username, :first_name, :last_name
    json.full_name "#{track.user.first_name} #{track.user.last_name}"
  end
end

json.metadata do
  json.current_page @collection.current_page
  json.total_pages @collection.total_pages
  json.total_count @collection.total_count
  json.next_page @collection.next_page
  json.prev_page @collection.prev_page
  json.is_first_page @collection.first_page?
  json.is_last_page @collection.last_page?
end
