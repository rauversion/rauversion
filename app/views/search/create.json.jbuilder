json.users users do |user|
  json.extract! user, :id, :username, :first_name, :last_name, :bio, :city, :country
end

json.playlists playlists do |playlist|
  json.extract! playlist, :id, :title, :description, :genre, :tags, :user_id
end

json.tracks tracks do |track|
  json.extract! track, :id, :title, :description, :genre, :tags, :user_id
end
