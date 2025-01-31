json.track do
  json.id @track.id
  json.title @track.title
  json.description @track.description
  json.private @track.private
  json.slug @track.slug
  json.caption @track.caption
  json.notification_settings @track.notification_settings
  json.metadata @track.metadata
  json.likes_count @track.likes_count
  json.reposts_count @track.reposts_count
  json.state @track.state
  json.genre @track.genre
  json.tags @track.tags
  json.podcast @track.podcast
  json.created_at @track.created_at
  json.updated_at @track.updated_at

  json.user do
    json.id @track.user.id
    json.username @track.user.username
    json.avatar_url @track.user.avatar_url if @track.user.avatar.attached?
    json.bio @track.user.bio
    json.followers_count @track.user.followers_count
    json.following_count @track.user.following_count
  end

  if @track.label
    json.label do
      json.id @track.label.id
      json.username @track.label.username
      json.avatar_url @track.label.avatar_url if @track.label.avatar.attached?
    end
  end

  json.cover_url do
    json.small @track.cover.variant(:small).processed.url if @track.cover.attached?
    json.medium @track.cover.variant(:medium).processed.url if @track.cover.attached?
    json.large @track.cover.variant(:large).processed.url if @track.cover.attached?
  end

  if @track.audio.attached?
    json.audio_url @track.audio.url
    json.duration @track.audio.metadata["duration"] if @track.audio.metadata
  end

  if @track.mp3_audio.attached?
    json.mp3_url @track.mp3_audio.url
  end

  if @track.track_peak
    json.peaks @track.track_peak.data
  end

  json.likes @track.likes_count || 0
  json.reposts @track.reposts_count || 0
  json.comments_count @track.comments.count

  json.comments @track.comments.includes(:user).order(created_at: :desc) do |comment|
    json.id comment.id
    json.body comment.body
    json.track_minute comment.track_minute
    json.created_at comment.created_at
    json.user do
      json.id comment.user.id
      json.username comment.user.username
      json.avatar_url comment.user.avatar_url if comment.user.avatar.attached?
    end
  end

  json.playlists @track.playlists.includes(:user).order(created_at: :desc) do |playlist|
    json.id playlist.id
    json.title playlist.title
    json.description playlist.description
    json.private playlist.private
    json.user do
      json.id playlist.user.id
      json.username playlist.user.username
      json.avatar_url playlist.user.avatar_url if playlist.user.avatar.attached?
    end
  end
end
