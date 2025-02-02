json.extract! track, :id, :title, :slug, :description, :private, :tags, :created_at, :updated_at

json.cover_url track.cover.attached? ? url_for(track.cover) : nil
json.audio_url track.audio.attached? ? url_for(track.audio) : nil

json.user do
  json.extract! track.user, :id, :username, :full_name
  json.avatar_url track.user.avatar.attached? ? url_for(track.user.avatar) : nil
end
