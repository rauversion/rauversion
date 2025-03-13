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
  json.processed  @track.processed?

  json.buy_link @track.buy_link
  json.price number_to_currency(@track.price)
  json.name_your_price @track.name_your_price

  json.user do
    json.partial! 'users/user', user: @track.user, show_full_name: true, show_bio: true
  end

  if @track.label
    json.label do
      json.partial! 'users/user', user: @track.user, show_full_name: true
    end
  end

  json.cover_url do
    json.small @track.cover_url(:small)
    json.medium @track.cover_url(:medium)
    json.large @track.cover_url(:large)
  end

  if @track.audio.attached?
    json.audio_url Rails.application.routes.url_helpers.rails_storage_proxy_url(@track.audio)
    json.duration @track.audio.metadata["duration"] if @track.audio.metadata
  end

  if @track.mp3_audio.attached?
    json.mp3_url Rails.application.routes.url_helpers.rails_storage_proxy_url(@track.mp3_audio)
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
    # json.track_minute comment.track_minute
    json.created_at comment.created_at
    json.user do
      json.partial! 'users/user', user: comment.user, show_full_name: true
    end
  end

  json.playlists @track.playlists.includes(:user).order(created_at: :desc) do |playlist|
    json.id playlist.id
    json.title playlist.title
    json.description playlist.description
    json.private playlist.private
    json.user do
      json.partial! 'users/user', user: playlist.user, show_full_name: true
    end
  end
end
