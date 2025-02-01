json.collection @posts do |post|
  json.extract! post, :id, :title, :state, :slug, :signed_id
  json.created_at post.created_at
  json.updated_at post.updated_at
  
  json.user do
    json.extract! post.user, :id, :username
    json.avatar do
      json.small post.user.avatar_url(:small)
    end
  end
end

json.metadata do
  json.current_page @posts.current_page
  json.total_pages @posts.total_pages
  json.total_count @posts.total_count
  json.next_page @posts.next_page
  json.prev_page @posts.prev_page
  json.is_first_page @posts.first_page?
  json.is_last_page @posts.last_page?
end
