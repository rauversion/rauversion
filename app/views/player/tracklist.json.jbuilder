json.tracks @tracks do |track|
  json.extract! track, :id, :title, :description, :duration, :slug
  json.audio_url url_for(track.mp3_audio) if track.mp3_audio.attached?
  json.cover_url track.cover_url(:small) if track.cover.attached?
  
  json.user do
    json.extract! track.user, :id, :username, :full_name
    json.avatar_url url_for(track.user.avatar) if track.user.avatar.attached?
  end
end
