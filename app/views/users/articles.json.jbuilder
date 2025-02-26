json.collection @articles do |article|
  json.extract! article, :id, :title, :excerpt, :slug, :created_at
  json.cover_url do
    json.small article.cover_url(:small)
    json.medium article.cover_url(:medium)
    json.large article.cover_url(:large)
  end
  json.user do
    json.extract! article.user, :id, :username, :first_name, :last_name
    json.full_name "#{article.user.first_name} #{article.user.last_name}"
    json.avatar_url do
      json.small article.user.avatar_url(:small)
      json.medium article.user.avatar_url(:medium)
    end
  end
end

json.metadata do
  json.current_page @articles.current_page
  json.total_pages @articles.total_pages
  json.total_count @articles.total_count
  json.next_page @articles.next_page
  json.prev_page @articles.prev_page
  json.is_first_page @articles.first_page?
  json.is_last_page @articles.last_page?
end
