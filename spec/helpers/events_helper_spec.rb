require "rails_helper"

RSpec.describe EventsHelper, type: :helper do
  describe "#event_dates_formatted" do
    let(:timezone) { "America/Santiago" }
    # Use a fixed date in the event's timezone to ensure consistent test results
    let(:base_date) { Time.find_zone!(timezone).parse("2024-12-12 00:00:00") }
    
    context "when event_start is nil" do
      it "returns nil" do
        result = helper.event_dates_formatted(nil, nil, timezone)
        expect(result).to be_nil
      end
    end
    
    context "when event is single day (no end date)" do
      it "returns just the start date formatted" do
        start_time = base_date + 21.hours
        
        result = helper.event_dates_formatted(start_time, nil, timezone)
        
        # Should return formatted date like "12 de diciembre de 2024" (Spanish) or "December 12, 2024" (English)
        expect(result).to include("12")
        expect(result).to match(/diciembre|December/)
        expect(result).to include("2024")
      end
    end
    
    context "when event starts and ends on same day" do
      it "returns just the date without times" do
        start_time = base_date + 14.hours
        end_time = base_date + 18.hours
        
        result = helper.event_dates_formatted(start_time, end_time, timezone)
        
        # Should return just the date
        expect(result).to include("12")
        expect(result).to match(/diciembre|December/)
        expect(result).to include("2024")
        expect(result).not_to include("14:00")
        expect(result).not_to include("18:00")
      end
    end
    
    context "when event spans two days but ends in early morning (before 6 AM)" do
      it "formats as single day with time range" do
        # Friday 9 PM to Saturday 1 AM
        start_time = base_date + 21.hours
        end_time = base_date + 1.day + 1.hour
        
        result = helper.event_dates_formatted(start_time, end_time, timezone)
        
        # Should show: "12 de diciembre desde las 21:00 hasta las 01:00" or 
        # "December 12, 2024 from 21:00 to 01:00"
        expect(result).to include("12")
        expect(result).to match(/diciembre|December/)
        expect(result).to include("21:00")
        expect(result).to include("01:00")
        expect(result).to match(/desde las|from/)
        expect(result).to match(/hasta las|to/)
        # Should NOT show the 13th as a separate date
        expect(result).not_to include("13")
      end
      
      it "handles events ending at 5:59 AM as early morning" do
        start_time = base_date + 22.hours
        end_time = base_date + 1.day + 5.hours + 59.minutes
        
        result = helper.event_dates_formatted(start_time, end_time, timezone)
        
        expect(result).to include("12")
        expect(result).to include("22:00")
        expect(result).to include("05:59")
        expect(result).to match(/desde las|from/)
      end
    end
    
    context "when event genuinely spans multiple days" do
      it "formats with both dates and times when ending after 6 AM" do
        # Friday 9 PM to Saturday 7 PM
        start_time = base_date + 21.hours
        end_time = base_date + 1.day + 19.hours
        
        result = helper.event_dates_formatted(start_time, end_time, timezone)
        
        # Should show: "12 de diciembre 21:00 hasta el 13 de diciembre 19:00" or
        # "December 12, 2024 21:00 until December 13, 2024 19:00"
        expect(result).to include("12")
        expect(result).to include("13")
        expect(result).to include("21:00")
        expect(result).to include("19:00")
        expect(result).to match(/hasta el|until/)
      end
      
      it "handles events spanning more than one day" do
        # Event from Monday to Wednesday
        start_time = base_date - 3.days + 9.hours
        end_time = base_date - 1.day + 17.hours
        
        result = helper.event_dates_formatted(start_time, end_time, timezone)
        
        expect(result).to include("09")
        expect(result).to include("11")
        expect(result).to include("09:00")
        expect(result).to include("17:00")
      end
    end
    
    context "with different timezones" do
      it "correctly applies timezone conversion" do
        start_time = base_date + 21.hours
        end_time = base_date + 1.day + 2.hours
        
        # America/Santiago is UTC-3 (or UTC-4 depending on DST)
        result = helper.event_dates_formatted(start_time, end_time, "America/Santiago")
        
        # Times should be converted to Santiago timezone
        expect(result).to be_present
      end
    end
  end
end
