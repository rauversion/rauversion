json.collection @spotlights do |spotlight|
  json.partial! 'spotlights/spotlight', spotlight: spotlight
end
