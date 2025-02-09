json.stats do
  json.plays 71897
  json.likes "58.16%"
  json.reposts "24.57%"
  json.downloads "24.57%"
  json.comments "24.57%"
end

json.chart_data Track.series_by_month(@user.id)

json.top_tracks Track.top_tracks(@user.id) do |track|
  json.extract! track, :id, :title, :count
  json.cover_url do
    json.small track.cover_url(:small)
    json.medium track.cover_url(:medium)
  end
end

json.top_listeners Track.top_listeners(@user.id) do |listener|
  json.extract! listener, :id, :username, :count
  json.avatar_url do
    json.small listener.avatar_url(:small)
    json.medium listener.avatar_url(:medium)
  end
end

json.top_countries Track.top_countries(@user.id) do |location|
  json.country location.country
  json.count location.count
  json.flag_url "https://flagcdn.com/w40/#{location.country.downcase}.png" unless location.country.blank?
end
