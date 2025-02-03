json.playlist do
  json.extract! @playlist,
    :id,
    :title,
    :description,
    :private,
    :genre,
    :contains_music,
    :artist,
    :publisher,
    :isrc,
    :composer,
    :release_title,
    :buy_link,
    :album_title,
    :record_label,
    :copyright,
    :attribution,
    :noncommercial,
    :copies,
    :direct_download,
    :display_embed,
    :enable_comments,
    :display_comments,
    :display_stats,
    :include_in_rss,
    :offline_listening,
    :enable_app_playblack,
    :price,
    :name_your_price,
    :tags,
    :slug,
    :created_at,
    :updated_at

  json.cover @playlist.cover.url if @playlist.cover.present?
  
  json.user do
    json.extract! @playlist.user, :id, :username, :email
  end

  json.tracks @playlist.tracks do |track|
    json.extract! track, 
      :id, 
      :title, 
      :description,
      :private,
      :position
    json.cover track.cover.url if track.cover.present?
    json.audio track.audio.url if track.audio.present?
  end
end

json.status "ok"
json.message "Playlist updated successfully"
