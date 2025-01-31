json.items @articles do |article|
  json.id article.id
  json.slug article.slug
  json.title article.title
  json.excerpt article.excerpt
  json.created_at article.created_at
  json.updated_at article.updated_at
  json.state article.state
  json.reading_time article.settings["reading_time"]
  json.cover_url do
    json.medium article.cover_url(:medium)
    json.small article.cover_url(:small)
    json.large article.cover_url(:large)
    json.horizontal article.cover_url(:horizontal)
  end
  
  if article.category
    json.category do
      json.id article.category.id
      json.name article.category.name
      json.slug article.category.slug
    end
  end
  
  json.author do
    json.username article.user.username
    json.name article.user.full_name
    json.avatar_url do
      json.medium article.user.avatar_url(:medium)
      json.small article.user.avatar_url(:small)
    end
  end
  
  json.tags article.tags
end

json.total_count @articles.total_count
json.current_page @articles.current_page
json.total_pages @articles.total_pages

json.categories @categories do |category|
  json.id category.id
  json.name category.name
  json.slug category.slug
  json.posts_count category.posts_count
end

json.popular_tags @popular_tags do |tag|
  json.tag tag.tag
  json.count tag.count
end
