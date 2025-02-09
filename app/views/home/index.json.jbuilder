json.currentUser current_user
json.appName ENV["APP_NAME"]
json.displayHero ENV["DISPLAY_HERO"]

json.artists @artists do |artist|
  json.extract! artist, :id, :username, :full_name, :bio
  json.avatar_url do
    json.medium artist.avatar_url(:medium)
    json.small artist.avatar_url(:small)
  end
  #json.followers_count artist.followers.count
  #json.tracks_count artist.tracks.count
end

json.posts @posts do |post|
  json.extract! post, :id, :title, :slug, :created_at
  json.cover_url do
    json.large post.cover_url(:large)
    json.medium post.cover_url(:medium)
  end
  json.user do
    json.extract! post.user, :id, :username
    json.avatar_url do
      json.medium post.user.avatar_url(:medium)
      json.small post.user.avatar_url(:small)
    end
  end
end

json.albums @albums do |album|
  json.extract! album, :id, :title, :slug, :created_at, :description
  json.cover_url do
    json.medium album.cover_url(:medium)
    json.small album.cover_url(:small)
  end
  json.user do
    json.extract! album.user, :id, :username
    json.avatar_url do
      json.medium album.user.avatar_url(:medium)
      json.small album.user.avatar_url(:small)
    end
  end
end

json.playlists @playlists do |playlist|
  json.extract! playlist, :id, :title, :slug, :created_at, :description
  json.cover_url do
    json.medium playlist.cover_url(:medium)
    json.small playlist.cover_url(:small)
  end
  json.user do
    json.extract! playlist.user, :id, :username
    json.avatar_url do
      json.medium playlist.user.avatar_url(:medium)
      json.small playlist.user.avatar_url(:small)
    end
  end
end

json.latestReleases @latest_releases do |release|
  json.extract! release, :id, :title, :slug, :created_at, :description
  json.cover_url do
    json.medium release.cover_url(:medium)
    json.small release.cover_url(:small)
  end
  json.user do
    json.extract! release.user, :id, :username
    json.avatar_url do
      json.medium release.user.avatar_url(:medium)
      json.small release.user.avatar_url(:small)
    end
  end
end
