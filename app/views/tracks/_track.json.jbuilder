json.id track.id
json.title track.title
json.slug track.slug
json.description track.description
json.price track.price
json.price number_to_currency(track.price) unless track.price.nil?
json.mp3_audio_url url_for(track.mp3_audio) if track.mp3_audio.attached?

json.cover_url do
  if track.cover.attached?
    json.medium track.cover_url(:medium)
    json.small track.cover_url(:small)
  else
    json.medium track.user.avatar_url(:medium)
    json.small track.user.avatar_url(:small)
  end
end
json.user do
  json.partial! 'users/user', user: track.user
end
