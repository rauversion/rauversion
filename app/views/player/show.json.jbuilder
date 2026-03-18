json.track do
  json.id @track.id
  json.slug @track.slug
  json.title @track.title
  json.url track_path(@track)
  json.audio_url @track.mp3_audio&.url if @track.mp3_audio.attached?
  json.description @track.description
  json.artwork_url @track.cover_url(:small)
  json.has_video @track.video.attached?
  video_media = @track.video_playback_media
  if video_media&.attached?
    json.video_url Rails.application.routes.url_helpers.rails_storage_proxy_url(video_media)
  end
  json.artist_name @track.artists.any? ? @track.artists.map(&:display_name).reject(&:blank?).join(", ") : (@track.artist.presence || @track.user.display_name)
  json.album_title @track.album_title.presence || @track.release_title.presence || @track.playlists.find { |playlist| %w[album ep single compilation].include?(playlist.playlist_type.to_s) }&.title || "Rauversion"
  json.likes_count @track.respond_to?(:likes_count) ? @track.likes_count.to_i : @track.likes.count
  json.like_id @track.respond_to?(:like_id) && @track.like_id.present?
  json.liked_by_current_user @track.respond_to?(:like_id) && @track.like_id.present?
  json.artwork_urls do
    json.small @track.cover_url(:small)
    json.medium @track.cover_url(:medium)
    json.large @track.cover_url(:large)
    json.original @track.cover_url(:original)
  end
  
  json.user_id @track.user.id
  json.user_full_name @track.user.display_name
  json.user_username @track.user.username
  json.user_url user_path(@track.user.username)
  json.user_avatar_url do
    json.small @track.user.avatar_url(:small)
    json.medium @track.user.avatar_url(:medium)
    json.large @track.user.avatar_url(:large)
  end
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
