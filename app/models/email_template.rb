class EmailTemplate < ApplicationRecord
  DEFAULT_THEME = {
    "bodyBackground" => "#f3f0ea",
    "contentBackground" => "#ffffff",
    "contentWidth" => 600,
    "fontFamily" => "sans",
    "textColor" => "#3b2f2f",
    "headingColor" => "#1f1a17",
    "accentColor" => "#b85c38",
    "footerText" => "Rauversion",
    "unsubscribeUrl" => "",
  }.freeze

  belongs_to :user

  validates :name, presence: true
  validates :subject, presence: true
  validate :document_must_be_a_hash

  before_validation :normalize_document_payload

  def normalized_document
    payload = document.is_a?(Hash) ? document.deep_stringify_keys : {}

    {
      "schemaVersion" => payload["schemaVersion"] || 1,
      "name" => payload["name"].presence || name,
      "subject" => payload["subject"].presence || subject,
      "preheader" => payload["preheader"].presence || preheader.to_s,
      "theme" => DEFAULT_THEME.deep_dup.merge(payload["theme"].is_a?(Hash) ? payload["theme"].deep_stringify_keys : {}),
      "blocks" => payload["blocks"].is_a?(Array) ? payload["blocks"] : [],
    }
  end

  private

  def normalize_document_payload
    name_explicitly_blank = will_save_change_to_name? && name.blank?
    subject_explicitly_blank = will_save_change_to_subject? && subject.blank?

    self.document = normalized_document
    self.name = document["name"].presence || name unless name_explicitly_blank
    self.subject = document["subject"].presence || subject unless subject_explicitly_blank
    self.preheader = document["preheader"].presence || preheader
  end

  def document_must_be_a_hash
    return if document.is_a?(Hash)

    errors.add(:document, "must be a JSON object")
  end
end
