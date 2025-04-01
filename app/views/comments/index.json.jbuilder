json.comments do
  json.array! @comments do |comment|
    json.partial! 'comments/comment', comment: comment
  end
end

json.meta do
  json.total_pages @comments.total_pages
  json.current_page @comments.current_page
  json.total_count @comments.total_count
end
