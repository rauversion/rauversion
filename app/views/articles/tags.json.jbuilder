json.array! @popular_tags do |tag|
  json.tag tag.tag
  json.count tag.count
end
