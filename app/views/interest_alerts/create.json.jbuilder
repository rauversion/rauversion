json.interest_alert do
  json.id @interest_alert.id
  json.role @interest_alert.role
  json.body @interest_alert.body
  json.approved @interest_alert.approved
  json.created_at @interest_alert.created_at
end

json.message "Your interest in becoming a #{@interest_alert.role} has been submitted."
json.status :success
