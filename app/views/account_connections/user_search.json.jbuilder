json.collection @artists do |artist|
  json.extract! artist, :id, :username, :full_name

  json.avatar_url do
    json.small artist.avatar_url(:small)
    json.medium artist.avatar_url(:medium)
    json.large artist.avatar_url(:large)
  end
end

if @artists.respond_to?(:current_page)
  json.metadata do
    json.partial! 'shared/pagination_metadata', collection: @artists
  end
end
