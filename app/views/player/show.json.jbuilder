json.track do
  json.id @track.id
  json.title @track.title
  json.url track_path(@track)
  json.audio_url @track.mp3_audio&.url if @track.mp3_audio.attached?
  json.artwork_url @track.cover_url(:small) if @track.cover.attached?
  
  json.user_username @track.user.username
  json.user_url user_path(@track.user)
end

# Get the playlist from the store if available
playlist = Track.where(id: params[:playlist_ids]&.split(','))
                .with_attached_cover
                .includes(user: {avatar_attachment: :blob})
                .order(created_at: :desc)

json.playlist playlist.map(&:id) if playlist.present?

# Add next and previous track information
json.next_track do
  next_track = Track.where("id > ?", @track.id).order(id: :asc).first
  if next_track
    json.id next_track.id
    json.title next_track.title
    json.url track_path(next_track)
  end
end

json.previous_track do
  prev_track = Track.where("id < ?", @track.id).order(id: :desc).first
  if prev_track
    json.id prev_track.id
    json.title prev_track.title
    json.url track_path(prev_track)
  end
end
