json.article do
  json.extract! @article, :id, :title, :body, :state, :private, :excerpt, :tags, :slug
  json.category do
    if @article.category
      json.extract! @article.category, :id, :name
    end
  end
  json.cover_url @article.cover_url(:medium) if @article.cover.attached?
end

json.categories Category.all do |category|
  json.extract! category, :id, :name
end

json.states [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' }
]
