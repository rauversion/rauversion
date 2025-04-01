json.user do
  json.extract! @user, :id, :username, :first_name, :last_name, :country, :city, 
                :bio, :email, :hide_username_from_profile, 
                :role, :created_at, :updated_at
  
  json.avatar_url do
    json.small @user.avatar_url(:small)
    json.medium @user.avatar_url(:medium)
    json.large @user.avatar_url(:large)
  end

  json.followers_count @user.followers(User).size
  json.followees_count @user.followees(User).size
  json.tracks_count @user.tracks.count

  json.photos @user.photos do |photo|
    json.id photo.id
    json.image_url photo.image.url
    json.variants do
      json.small photo.image.variant(resize_to_fill: [350, 250]).url
      json.medium photo.image.variant(resize_to_fill: [700, 500]).url
      json.large photo.image.variant(resize_to_fill: [1400, 1000]).url
    end
  end
end

json.stats do
  json.monthly_listeners Track.series_by_month(@user.id, range: 1).first&.fetch(:count, 0)
  json.top_countries Track.top_countries(@user.id) do |location|
    json.country location.country
    json.count location.count
  end
end
