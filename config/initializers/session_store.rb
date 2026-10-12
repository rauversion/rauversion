session_options = {
  key: "_rauversion_session",
  same_site: :lax
}

# OAuth starts and finishes on the base domain, then returns to a tenant.
session_options[:domain] = ENV["SESSION_COOKIE_DOMAIN"].presence || :all
session_options[:tld_length] = Rails.application.config.action_dispatch.tld_length + 1

Rails.application.config.session_store :cookie_store, **session_options
