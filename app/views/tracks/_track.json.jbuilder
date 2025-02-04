json.extract! track, 
  :id, 
  :title, 
  :slug, 
  :description, 
  :private, 
  :tags, 
  :created_at, 
  :updated_at,
  :genre,
  :contains_music,
  :artist,
  :publisher,
  :isrc,
  :composer,
  :release_title,
  :buy_link,
  :album_title,
  :record_label,
  :podcast,
  :price,
  :name_your_price

json.tag_list track.tags
json.cover_url do
  json.small track.cover_url(:small)
  json.medium track.cover_url(:medium)
  json.large track.cover_url(:large)
end if track.cover.attached?

json.audio_url track.audio.attached? ? url_for(track.audio) : nil
json.peaks track.track_peak&.data || []

json.user do
  json.extract! track.user, :id, :username, :first_name, :last_name, :full_name
  json.full_name "#{track.user.first_name} #{track.user.last_name}"
  json.avatar_url track.user.avatar.attached? ? url_for(track.user.avatar) : nil
end
