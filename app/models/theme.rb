class Theme < ApplicationRecord
  validates :name, presence: true
  validates :deploy_options, presence: true

  scope :system_themes, -> { where(system_theme: true) }
  scope :for_site, ->(site_id) { where(site_id: site_id) }

  def repo
    deploy_options.dig("repo")
  end

  def ref
    deploy_options.dig("ref") || "main"
  end

  def env
    deploy_options.dig("env") || "production"
  end

  def github_tarball_url
    return nil unless repo.present?
    "https://api.github.com/repos/#{repo}/tarball/#{ref}"
  end
end
