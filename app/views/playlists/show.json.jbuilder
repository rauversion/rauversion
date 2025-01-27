json.extract! @playlist,
  :id,
  :title,
  :slug,
  :description,
  :playlist_type,
  :private,
  :metadata,
  :created_at,
  :updated_at

json.user do
  json.extract! @playlist.user, :id, :username, :full_name, :avatar_url
end

if @playlist.label.present?
  json.label do
    json.extract! @playlist.label, :id, :username, :full_name, :avatar_url
  end
end

json.cover_url @playlist.cover.attached? ? url_for(@playlist.cover) : nil
json.url url_for(@playlist)
json.tracks @playlist.track_playlists.includes(:track) do |track_playlist|
  track = track_playlist.track
  json.extract! track, :id, :title, :description, :duration
  begin
  json.audio_url url_for(track.mp3_audio) if track.audio.attached?
  rescue
  end
  json.cover_url url_for(track.cover) if track.cover.attached?
  json.position track_playlist.position
  json.author do
    json.extract! track.user, :id, :username, :full_name, :avatar_url
  end
end

json.likes_count @playlist.likes.size
json.comments_count @playlist.comments.size

#json.metadata  do
  json.extract! @playlist, :buy_link, :buy, :title, :record_label
#end
