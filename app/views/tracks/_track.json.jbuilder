json.id track.id
json.title track.title
json.slug track.slug
json.description track.description
json.price track.price
json.price number_to_currency(track.price) unless track.price.nil?
json.private track.private
json.duration track.duration

if track.mp3_audio.attached?
  json.mp3_audio_url url_for(track.mp3_audio)
  json.audio_url url_for(track.mp3_audio)
end

json.metadata track.metadata
json.likes_count track.likes.count
json.like_id track.respond_to?(:like_id) && track&.like_id.present?
json.reposts_count track.reposts_count
json.state track.state
json.genre track.genre
json.tags track.tags
json.podcast track.podcast
json.created_at track.created_at
json.updated_at track.updated_at
json.processed  track.processed?

json.buy_link track.buy_link
json.price track.price
json.formatted_price number_to_currency(track.price)
json.name_your_price track.name_your_price



json.cover_url do
  if track.cover.attached?
    json.medium track.cover_url(:medium)
    json.small track.cover_url(:small)
    json.large track.cover_url(:large)
    json.cropped_image url_for(track.cropped_image)
  else
    json.medium track.user.avatar_url(:medium)
    json.small track.user.avatar_url(:small)
    json.large track.cover_url(:large)
    json.cropped_image track.user.avatar_url(:medium)
  end
end
json.user do
  json.partial! 'users/user', user: track.user
end
