json.service_booking_proposals @service_booking_proposals do |proposal|
  json.partial! "service_booking_proposals/proposal", proposal: proposal
end
