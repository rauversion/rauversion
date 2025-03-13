json.collection @posts do |post|
  json.extract! post, :id, :title, :state, :slug, :signed_id
  json.created_at post.created_at
  json.updated_at post.updated_at
  
  json.user do
    json.partial! 'users/user', user: post.user, show_full_name: true
  end
end

json.metadata do
  json.partial! 'shared/pagination_metadata', collection: @posts
end
