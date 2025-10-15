# Venue Reviews summary JSON
json.venue_id @venue.id
json.overall_avg @overall_avg
json.total_reviews @total_reviews
json.role_counts @role_counts

json.trend @trend do |point|
  json.year point[:year]
  json.rating point[:rating]
end

json.aspects @aspects do |a|
  json.name a[:name]
  json.avg a[:avg]
  json.count a[:count]
end
