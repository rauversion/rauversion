class ScheduleScheduling < ApplicationRecord
  belongs_to :event_schedule

  validates :name, :start_date, :end_date, :short_description, presence: true

  validates :end_date, comparison: {greater_than: :start_date}

  # TODO: skip for now, lets ditch the date, and only use times 
  # validate :dates_within_event_schedule

  private

  def dates_within_event_schedule
    return if event_schedule.blank? || start_date.blank? || end_date.blank?
    if start_date < event_schedule.start_date || end_date > event_schedule.end_date
      errors.add(:base, "Schedule dates must be within the event schedule dates")
    end
  end
end
