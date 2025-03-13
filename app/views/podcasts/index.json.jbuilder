json.collection @collection do |track|
  json.id track.id
  json.title track.title
  json.slug track.slug
  json.description track.description
  json.created_at track.created_at
  json.updated_at track.updated_at
  json.user do
    json.partial! 'users/user', user: track.user, show_full_name: true
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
  json.partial! 'shared/pagination_metadata', collection: @collection
end
