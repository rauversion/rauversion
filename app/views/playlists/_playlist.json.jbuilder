json.extract! playlist,
  :id,
  :title,
  :description,
  :private,
  :genre,
  :playlist_type,
  :release_date,
  :custom_genre,
  :likes_count,
  :tags,
  :label_id,
  :editor_choice_position,
  :slug,
  :created_at,
  :updated_at

json.metadata do
  json.buy_link playlist.buy_link
  json.buy_link_title playlist.buy_link_title
  json.buy playlist.buy
  json.record_label playlist.record_label
end

json.cover playlist.cover.url if playlist.cover.present?

json.user do
  json.extract! playlist.user, :id, :username, :email
end

json.tracks playlist.tracks do |track|
  json.extract! track, 
    :id, 
    :title, 
    :description,
    :private,
    :position
  json.cover track.cover.url if track.cover.present?
  json.audio track.audio.url if track.audio.present?
end
