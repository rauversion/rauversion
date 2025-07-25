json.array!(@pages) do |page|
  json.extract! page, :id, :title, :slug, :published, :menu, :body, :settings, :created_at, :updated_at
end
