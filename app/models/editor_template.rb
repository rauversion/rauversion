class EditorTemplate < ApplicationRecord
  DEFAULT_PAGE_STYLE = {
    "primaryColor" => "#6366f1",
    "template" => "minimal",
    "darkMode" => true,
    "fontFamily" => "sans",
  }.freeze

  belongs_to :user, optional: true

  validates :name, presence: true
  validates :category, presence: true
  validates :page_data, presence: true
  validate :page_data_must_be_a_hash

  scope :for_category, ->(category) { category.present? ? where(category: category) : all }
  scope :available_for, lambda { |user|
    user.present? ? where(user_id: [nil, user.id]) : where(user_id: nil)
  }
  scope :ordered_for_editor, -> {
    order(Arel.sql("CASE WHEN user_id IS NULL THEN 0 ELSE 1 END ASC"), :name, :id)
  }

  def normalized_page_data
    payload = page_data.is_a?(Hash) ? page_data.deep_stringify_keys : {}

    {
      "name" => payload["name"].presence || name,
      "blocks" => payload["blocks"].is_a?(Array) ? payload["blocks"] : [],
      "style" => default_page_style.merge(payload["style"].is_a?(Hash) ? payload["style"] : {}),
    }
  end

  private

  def default_page_style
    DEFAULT_PAGE_STYLE.deep_dup
  end

  def page_data_must_be_a_hash
    return if page_data.is_a?(Hash)

    errors.add(:page_data, "must be a JSON object")
  end
end
