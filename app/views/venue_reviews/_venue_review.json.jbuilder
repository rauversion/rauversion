json.id review.id
json.venue_id review.venue_id
json.user_id review.user_id
json.reviewer_role review.reviewer_role
json.overall_rating review.overall_rating.to_f if review.overall_rating
json.aspects review.aspects
json.comment review.comment
json.created_at review.created_at
json.updated_at review.updated_at

json.user do
  user = review.user
  json.id user.id
  json.username user.username
  json.first_name user.first_name
  json.last_name user.last_name
end
