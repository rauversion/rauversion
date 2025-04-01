json.event do
  json.id @event.id
  json.slug @event.slug
  json.scheduling_settings @event.scheduling_settings
  
  json.event_schedules @event.event_schedules do |schedule|
    json.id schedule.id
    json.name schedule.name
    json.description schedule.description
    json.start_date schedule.start_date
    json.end_date schedule.end_date
    json.schedule_type schedule.schedule_type
    
    json.schedulings schedule.schedule_schedulings do |scheduling|
      json.id scheduling.id
      json.name scheduling.name
      json.start_date scheduling.start_date
      json.end_date scheduling.end_date
      json.short_description scheduling.short_description
    end
  end
end
