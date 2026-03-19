require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module RauversionRor
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    config.exceptions_app = routes

    config.hosts << "chaskiq.sa.ngrok.io"
    config.hosts << ENV["HOST"]

    config.mission_control.jobs.http_basic_auth_enabled = false
    config.mission_control.jobs.base_controller_class = "Admin::JobsController"

    config.hosts << "www.example.com" if Rails.env.test?

    config.active_storage.track_variants = true

    config.autoload_paths << Rails.root.join('lib')

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
