module PlaylistGen
  class LibraryUpload < ApplicationRecord
    has_one_attached :file

    STATUSES = %w[pending processing completed failed].freeze
    SOURCES = %w[rekordbox].freeze

    validates :status, inclusion: { in: STATUSES }
    validates :source, inclusion: { in: SOURCES }

    scope :pending, -> { where(status: "pending") }
    scope :processing, -> { where(status: "processing") }
    scope :completed, -> { where(status: "completed") }
    scope :failed, -> { where(status: "failed") }

    def completed?
      status == "completed"
    end

    def failed?
      status == "failed"
    end

    def processing?
      status == "processing"
    end

    def pending?
      status == "pending"
    end
  end
end
