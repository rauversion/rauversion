json.collection @collection do |track|
  json.id track.id
  json.title track.title
  json.slug track.slug
  json.description track.description
  json.created_at track.created_at
  json.updated_at track.updated_at
  json.user do
    json.id track.user.id
    json.username track.user.username
    json.avatar_url track.user.avatar_url(:small)
  end
  json.cover_url track.cropped_image

  json.audio_url track.mp3_audio.url
  json.peaks track.peaks
  json.duration track.duration
  json.likes_count track.likes_count
  json.comments_count track.comments.count
  # json.plays_count track.plays_count
  json.private track.private
  json.state track.state
  json.tags track.tags
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
