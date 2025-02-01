json.user do
  json.extract! @user, :id, :username, :first_name, :last_name, :country, :city, 
                :hide_username_from_profile, :role, :created_at, :updated_at
  
  json.avatar_url do
    json.small @user.avatar_url(:small)
    json.medium @user.avatar_url(:medium)
    json.large @user.avatar_url(:large)
  end

  json.profile_header_url do
    json.small @user.profile_header_url(:small)
    json.medium @user.profile_header_url(:medium)
    json.large @user.profile_header_url(:large)
  end

  json.is_label @user.label?
  json.can_sell_products @user.can_sell_products?
  
  json.stats do
    json.followers_count @user.followees(User).count
    json.following_count @user.followers(User).count
    json.tracks_count @user.tracks.size
  end

  json.menu_items [
    { to: user_path(@user.username), name: t("profile.all"), key: "all" },
    { to: user_albums_path(@user.username), name: t("profile.albums"), key: "albums" },
    { to: user_tracks_path(@user.username), name: t("profile.tracks"), key: "tracks" },
    @user&.podcaster_info&.active? ? { to: user_podcasts_path(@user.username), name: t("profile.podcasts"), key: "podcasts" } : nil,
    { to: user_reposts_path(@user.username), name: t("profile.reposts"), key: "reposts" },
    @user.is_admin? ? { to: user_articles_path(@user.username), name: t("profile.articles"), key: "articles" } : nil
  ].compact

  json.tracks @tracks do |track|
    json.extract! track, :id, :title, :description, :duration, :slug
    json.cover_url do
      json.small track.cover_url(:small)
      json.medium track.cover_url(:medium)
      json.large track.cover_url(:large)
    end
    json.author do
      json.extract! track.user, :id, :username, :first_name, :last_name
      json.full_name "#{track.user.first_name} #{track.user.last_name}"
    end
  end

  json.playlists @playlists do |playlist|
    json.extract! playlist, :id, :title, :description, :playlist_type, :private, :slug
    json.cover_url do
      json.small playlist.cover_url(:small)
      json.medium playlist.cover_url(:medium)
      json.large playlist.cover_url(:large)
    end
    json.tracks_count playlist.tracks.count
    json.user do
      json.extract! playlist.user, :id, :username, :first_name, :last_name
      json.full_name "#{playlist.user.first_name} #{playlist.user.last_name}"
    end
  end
end
