module EventsHelper
  # Formats event dates intelligently based on the duration and time range
  # 
  # Examples:
  # - Single day event: "12 de diciembre de 2024"
  # - Multi-day ending early morning (before 6 AM): "12 de diciembre desde las 21:00 hasta las 01:00"
  # - Multi-day ending later: "12 de diciembre 21:00 hasta el 13 de diciembre 19:00"
  #
  # @param event_start [ActiveSupport::TimeWithZone] Start datetime
  # @param event_ends [ActiveSupport::TimeWithZone] End datetime
  # @param timezone [String] Timezone for the event
  # @return [String] Formatted date range
  def event_dates_formatted(event_start, event_ends, timezone)
    return nil if event_start.nil?
    
    # Convert to event's timezone
    start_time = event_start.in_time_zone(timezone)
    
    # If no end date, just show the start date
    if event_ends.nil?
      return I18n.l(start_time.to_date, format: :long)
    end
    
    end_time = event_ends.in_time_zone(timezone)
    
    # If same day, just show the date
    if start_time.to_date == end_time.to_date
      return I18n.l(start_time.to_date, format: :long)
    end
    
    # Check if it's a multi-day event ending in early morning (before 6 AM)
    # This is typically the case for events that go past midnight but end early
    early_morning_threshold = 6
    
    if end_time.hour < early_morning_threshold && 
       (end_time.to_date - start_time.to_date).to_i == 1
      # Event ends in early morning of next day - treat as single day event with time range
      format_same_day_with_times(start_time, end_time)
    else
      # Event genuinely spans multiple days with substantial time on second day
      format_multi_day_with_times(start_time, end_time)
    end
  end
  
  private
  
  # Format for events ending in early morning (e.g., "12 de diciembre desde las 21:00 hasta las 01:00")
  def format_same_day_with_times(start_time, end_time)
    date_str = I18n.l(start_time.to_date, format: :long)
    start_hour = start_time.strftime("%H:%M")
    end_hour = end_time.strftime("%H:%M")
    
    "#{date_str} desde las #{start_hour} hasta las #{end_hour}"
  end
  
  # Format for genuine multi-day events (e.g., "12 de diciembre 21:00 hasta el 13 de diciembre 19:00")
  def format_multi_day_with_times(start_time, end_time)
    start_date = I18n.l(start_time.to_date, format: :long)
    start_hour = start_time.strftime("%H:%M")
    end_date = I18n.l(end_time.to_date, format: :long)
    end_hour = end_time.strftime("%H:%M")
    
    "#{start_date} #{start_hour} hasta el #{end_date} #{end_hour}"
  end
end
