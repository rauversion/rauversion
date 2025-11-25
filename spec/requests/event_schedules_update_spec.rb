require "rails_helper"

RSpec.describe "EventSchedules Update", type: :request do
  let(:user) { create(:user) }
  let(:event) { create(:event, user: user) }
  
  before do
    sign_in user
  end

  describe "PUT /events/:id with nested event_schedules_attributes" do
    context "when creating new schedules" do
      it "creates new event schedules without duplicates" do
        expect {
          put event_path(event, format: :json), params: {
            event: {
              event_schedules_attributes: [
                {
                  name: "Day 1",
                  description: "First day",
                  start_date: 1.day.from_now.iso8601,
                  end_date: 1.day.from_now.advance(hours: 8).iso8601,
                  schedule_type: "session"
                }
              ]
            }
          }
        }.to change(EventSchedule, :count).by(1)
        
        expect(response).to have_http_status(:success)
        expect(event.reload.event_schedules.count).to eq(1)
      end
    end

    context "when updating existing schedules" do
      let!(:schedule) { create(:event_schedule, event: event, name: "Original Name", start_date: 2.days.from_now, end_date: 2.days.from_now.advance(hours: 4)) }
      
      it "updates existing schedule without creating duplicates" do
        expect {
          put event_path(event, format: :json), params: {
            event: {
              event_schedules_attributes: [
                {
                  id: schedule.id,
                  name: "Updated Name",
                  description: "Updated description",
                  start_date: schedule.start_date.iso8601,
                  end_date: schedule.end_date.iso8601,
                  schedule_type: "session"
                }
              ]
            }
          }
        }.not_to change(EventSchedule, :count)
        
        expect(response).to have_http_status(:success)
        expect(schedule.reload.name).to eq("Updated Name")
      end
    end

    context "when deleting schedules" do
      let!(:schedule1) { create(:event_schedule, event: event, name: "Schedule 1", start_date: 2.days.from_now, end_date: 2.days.from_now.advance(hours: 4)) }
      let!(:schedule2) { create(:event_schedule, event: event, name: "Schedule 2", start_date: 3.days.from_now, end_date: 3.days.from_now.advance(hours: 4)) }
      
      it "deletes marked schedules" do
        expect {
          put event_path(event, format: :json), params: {
            event: {
              event_schedules_attributes: [
                {
                  id: schedule1.id,
                  _destroy: "1"
                },
                {
                  id: schedule2.id,
                  name: schedule2.name,
                  description: schedule2.description,
                  start_date: schedule2.start_date.iso8601,
                  end_date: schedule2.end_date.iso8601,
                  schedule_type: schedule2.schedule_type
                }
              ]
            }
          }
        }.to change(EventSchedule, :count).by(-1)
        
        expect(response).to have_http_status(:success)
        expect(EventSchedule.exists?(schedule1.id)).to be false
        expect(EventSchedule.exists?(schedule2.id)).to be true
      end
    end

    context "when mixing create, update, and delete operations" do
      let!(:existing_schedule) { create(:event_schedule, event: event, name: "Existing", start_date: 2.days.from_now, end_date: 2.days.from_now.advance(hours: 4)) }
      let!(:schedule_to_delete) { create(:event_schedule, event: event, name: "To Delete", start_date: 3.days.from_now, end_date: 3.days.from_now.advance(hours: 4)) }
      
      it "handles all operations correctly without duplicates" do
        initial_count = event.event_schedules.count
        
        put event_path(event, format: :json), params: {
          event: {
            event_schedules_attributes: [
              {
                id: schedule_to_delete.id,
                _destroy: "1"
              },
              {
                id: existing_schedule.id,
                name: "Updated Existing",
                description: existing_schedule.description,
                start_date: existing_schedule.start_date.iso8601,
                end_date: existing_schedule.end_date.iso8601,
                schedule_type: existing_schedule.schedule_type
              },
              {
                name: "New Schedule",
                description: "Brand new",
                start_date: 4.days.from_now.iso8601,
                end_date: 4.days.from_now.advance(hours: 6).iso8601,
                schedule_type: "session"
              }
            ]
          }
        }
        
        expect(response).to have_http_status(:success)
        expect(event.reload.event_schedules.count).to eq(initial_count) # -1 deleted, +1 created
        expect(existing_schedule.reload.name).to eq("Updated Existing")
        expect(event.event_schedules.pluck(:name)).to include("New Schedule")
        expect(event.event_schedules.pluck(:name)).not_to include("To Delete")
      end
    end

    context "with nested schedule_schedulings_attributes" do
      let!(:schedule) { create(:event_schedule, event: event, name: "Day 1", start_date: 2.days.from_now, end_date: 2.days.from_now.advance(hours: 8)) }
      let!(:scheduling1) { create(:schedule_scheduling, event_schedule: schedule, name: "Session 1", start_date: 2.days.from_now, end_date: 2.days.from_now.advance(hours: 2)) }
      
      it "creates new schedulings without duplicates" do
        expect {
          put event_path(event, format: :json), params: {
            event: {
              event_schedules_attributes: [
                {
                  id: schedule.id,
                  name: schedule.name,
                  description: schedule.description,
                  start_date: schedule.start_date.iso8601,
                  end_date: schedule.end_date.iso8601,
                  schedule_type: schedule.schedule_type,
                  schedule_schedulings_attributes: [
                    {
                      id: scheduling1.id,
                      name: scheduling1.name,
                      short_description: scheduling1.short_description,
                      start_date: scheduling1.start_date.iso8601,
                      end_date: scheduling1.end_date.iso8601
                    },
                    {
                      name: "Session 2",
                      short_description: "New session",
                      start_date: 2.days.from_now.advance(hours: 3).iso8601,
                      end_date: 2.days.from_now.advance(hours: 5).iso8601
                    }
                  ]
                }
              ]
            }
          }
        }.to change(ScheduleScheduling, :count).by(1)
        
        expect(response).to have_http_status(:success)
        expect(schedule.reload.schedule_schedulings.count).to eq(2)
      end
      
      it "deletes nested schedulings correctly" do
        scheduling2 = create(:schedule_scheduling, event_schedule: schedule, name: "Session 2", start_date: 2.days.from_now.advance(hours: 3), end_date: 2.days.from_now.advance(hours: 5))
        
        expect {
          put event_path(event, format: :json), params: {
            event: {
              event_schedules_attributes: [
                {
                  id: schedule.id,
                  name: schedule.name,
                  description: schedule.description,
                  start_date: schedule.start_date.iso8601,
                  end_date: schedule.end_date.iso8601,
                  schedule_type: schedule.schedule_type,
                  schedule_schedulings_attributes: [
                    {
                      id: scheduling1.id,
                      _destroy: "1"
                    },
                    {
                      id: scheduling2.id,
                      name: scheduling2.name,
                      short_description: scheduling2.short_description,
                      start_date: scheduling2.start_date.iso8601,
                      end_date: scheduling2.end_date.iso8601
                    }
                  ]
                }
              ]
            }
          }
        }.to change(ScheduleScheduling, :count).by(-1)
        
        expect(response).to have_http_status(:success)
        expect(ScheduleScheduling.exists?(scheduling1.id)).to be false
        expect(ScheduleScheduling.exists?(scheduling2.id)).to be true
      end
    end
  end
end
