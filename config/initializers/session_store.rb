session_options = {
  key: "_rauversion_session",
  same_site: :lax
}

if Rails.env.development?
  session_options[:domain] = :all
  session_options[:tld_length] = 2
elsif ENV["SESSION_COOKIE_DOMAIN"].present?
  session_options[:domain] = ENV["SESSION_COOKIE_DOMAIN"]
end

Rails.application.config.session_store :cookie_store, **session_options
