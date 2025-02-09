json.id @track.id
json.title @track.title
json.slug @track.slug
json.description @track.description
json.created_at @track.created_at
json.updated_at @track.updated_at
json.cover_url @track.cropped_image

json.audio_url @track.mp3_audio.url
json.peaks @track.peaks
json.duration @track.duration
json.likes_count @track.likes_count
json.comments_count @track.comments.count
# json.plays_count @track.plays_count
json.private @track.private
json.state @track.state
json.tags @track.tags

json.user do
  json.id @track.user.id
  json.username @track.user.username
  json.avatar_url @track.user.avatar_url(:small)
  
  if @track.user.podcaster_info.present?
    json.podcaster_info do
      json.title @track.user.podcaster_info.title
      json.description @track.user.podcaster_info.description
      json.about @track.user.podcaster_info.about
      json.settings @track.user.podcaster_info.settings
      json.highlight @track.user.podcaster_info.highlight
      json.active @track.user.podcaster_info.active
      
      json.hosts @track.user.podcaster_info.podcaster_hosts do |host|
        json.id host.user.id
        json.username host.user.username
        json.avatar_url host.user.avatar_url(:small)
        json.role host.role
      end
    end
  end
end


json.comments @track.comments.includes(:user).order(created_at: :desc) do |comment|
  json.id comment.id
  json.body comment.body
  json.created_at comment.created_at
  json.user do
    json.id comment.user.id
    json.username comment.user.username
    json.avatar_url comment.user.avatar_url(:small)
  end
end

json.likes @track.likes.includes(:liker).order(created_at: :desc) do |like|
  json.id like.id
  json.created_at like.created_at
  json.user do
    json.id like.liker.id
    json.username like.liker.username
    json.avatar_url like.liker.avatar_url(:small)
  end
end
