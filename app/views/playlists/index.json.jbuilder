json.metadata do
  json.pagination do
    json.current_page @playlists.current_page
    json.next_page @playlists.next_page
    json.prev_page @playlists.prev_page
    json.total_pages @playlists.total_pages
    json.total_count @playlists.total_count
    json.per_page @playlists.limit_value
  end
end

json.playlists do
  @playlists_by_type.each do |type, playlists|
    json.set! type do
      json.array! playlists do |playlist|
        json.extract! playlist,
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
          json.extract! playlist.user, :id, :username, :full_name, :avatar_url
        end

        if playlist.label.present?
          json.label do
            json.extract! playlist.label, :id, :username, :full_name, :avatar_url
          end
        end

        json.cover_url playlist.cover.attached? ? url_for(playlist.cover) : nil
        json.url url_for(playlist)
        
        json.tracks_count playlist.tracks.size
        json.likes_count playlist.likes.size
        json.comments_count playlist.comments.size
      end
    end
  end
end
