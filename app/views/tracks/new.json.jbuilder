json.artists @upload_artists do |artist|
  json.extract! artist, :id, :username, :display_name
end
