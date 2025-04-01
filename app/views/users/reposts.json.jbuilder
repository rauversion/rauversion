json.reposts @reposts do |repost|
  json.extract! repost, :id, :created_at
  
  json.repostable do
    case repost.repostable_type
    when "Track"
      json.type "track"
      json.extract! repost.repostable, :id, :title, :description, :duration, :slug
      json.cover_url do
        json.small repost.repostable.cover_url(:small)
        json.medium repost.repostable.cover_url(:medium)
        json.large repost.repostable.cover_url(:large)
      end
      json.author do
        json.extract! repost.repostable.user, :id, :username, :first_name, :last_name
        json.full_name "#{repost.repostable.user.first_name} #{repost.repostable.user.last_name}"
      end
    when "Playlist"
      json.type "playlist"
      json.extract! repost.repostable, :id, :title, :description, :playlist_type, :slug
      json.cover_url do
        json.small repost.repostable.cover_url(:small)
        json.medium repost.repostable.cover_url(:medium)
        json.large repost.repostable.cover_url(:large)
      end
      json.tracks_count repost.repostable.tracks.count
      json.author do
        json.extract! repost.repostable.user, :id, :username, :first_name, :last_name
        json.full_name "#{repost.repostable.user.first_name} #{repost.repostable.user.last_name}"
      end
    end
  end
end

json.pagination do
  json.current_page @reposts.current_page
  json.total_pages @reposts.total_pages
  json.total_count @reposts.total_count
end
