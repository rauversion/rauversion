json.extract! comment, :id, :body, :created_at, :updated_at
json.user do
  json.partial! 'users/user', user: comment.user, show_full_name: true
end
