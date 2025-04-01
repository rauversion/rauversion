require "rails_helper"

RSpec.describe ScheduleScheduling, type: :model do
  describe "validations" do
    let(:user) { FactoryBot.create(:user) }
    let(:event) { FactoryBot.create(:event, user: user) }
    let(:event_schedule) { FactoryBot.create(:event_schedule, event: event, start_date: 1.day.ago, end_date: 1.day.from_now) }

    #it "validates that schedule dates are within the event schedule dates" do
    #  schedule = FactoryBot.build(:schedule_scheduling, event_schedule: event_schedule, start_date: 2.days.ago, end_date: 2.days.from_now)
    #  expect(schedule).not_to be_valid
    #  expect(schedule.errors[:base]).to include("Schedule dates must be within the event schedule dates")
    #end

    it "is valid when schedule dates are within the event schedule dates" do
      schedule = FactoryBot.build(
        :schedule_scheduling,
        event_schedule: event_schedule,
        start_date: 1.day.ago,
        end_date: 1.day.from_now - 10.minutes
      )
      expect(schedule).to be_valid
    end
  end
end
