# Venue Reviews index JSON
json.venue_id @venue.id
json.reviewer_role params[:reviewer_role] if params[:reviewer_role].present?

json.reviews @reviews do |review|
  json.partial! "venue_reviews/venue_review", review: review
end

# Optional pagination meta if Kaminari is applied
if @reviews.respond_to?(:current_page)
  json.meta do
    json.current_page @reviews.current_page
    json.next_page @reviews.next_page
    json.prev_page @reviews.prev_page
    json.total_pages @reviews.total_pages
    json.total_count @reviews.total_count
    json.per_page @reviews.limit_value
  end
end
