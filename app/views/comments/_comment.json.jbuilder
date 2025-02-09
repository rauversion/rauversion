json.extract! comment, :id, :body, :created_at, :updated_at
json.user do
  json.extract! comment.user, :id, :username, :full_name
  json.avatar_url comment.user.avatar_url(:thumb) if comment.user.avatar.attached?
end
