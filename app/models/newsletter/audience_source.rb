class Newsletter::AudienceSource < ApplicationRecord
  SOURCE_TYPES = %w[contact_list followers event_attendees all_my_event_attendees].freeze

  belongs_to :audience, class_name: "Newsletter::Audience", inverse_of: :sources

  validates :source_type, presence: true, inclusion: { in: SOURCE_TYPES }
  validate :source_settings_must_match_type

  before_validation :normalize_source_settings

  private

  def normalize_source_settings
    self.source_settings =
      case source_settings
      when Hash
        source_settings.deep_stringify_keys
      else
        {}
      end
  end

  def source_settings_must_match_type
    case source_type
    when "contact_list"
      errors.add(:source_settings, "must include contact_list_id") if source_settings["contact_list_id"].blank?
    when "event_attendees"
      errors.add(:source_settings, "must include event_id") if source_settings["event_id"].blank?
    end
  end
end
