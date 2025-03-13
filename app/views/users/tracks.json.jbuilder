json.collection @tracks do |track|
  json.extract! track, :id, :title, :description, :duration, :slug, :created_at
  json.peaks track.track_peak&.data || []
  json.audio_url url_for(track.mp3_audio) if track.mp3_audio.attached?
  json.tag_list track.tags
  json.price number_to_currency(track.price) unless track.price.nil?
  json.name_your_price track.name_your_price
  json.cover_url do
    json.small track.cover_url(:small)
    json.medium track.cover_url(:medium)
    json.large track.cover_url(:large)
  end
  json.likes_count track.likes.count

  if track.respond_to?(:like_id)
    json.liked_by_current_user track&.like_id.present?
  end

  json.user do
    json.partial! 'users/user', user: track.user, show_full_name: true
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @collection
end
