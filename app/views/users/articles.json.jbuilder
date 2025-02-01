json.articles @articles do |article|
  json.extract! article, :id, :title, :description, :slug, :created_at
  json.cover_url do
    json.small article.cover_url(:small)
    json.medium article.cover_url(:medium)
    json.large article.cover_url(:large)
  end
  json.author do
    json.extract! article.user, :id, :username, :first_name, :last_name
    json.full_name "#{article.user.first_name} #{article.user.last_name}"
  end
end

json.pagination do
  json.current_page @articles.current_page
  json.total_pages @articles.total_pages
  json.total_count @articles.total_count
end
