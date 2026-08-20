class ApplicationMailer < ActionMailer::Base
  helper ApplicationHelper

  default from: -> { default_from_address }
  layout "mailer"

  def default_from_address
    email = default_email_account.presence || "changeme@at-env.com"
    app_name = ENV.fetch("APP_NAME", "Rauversion").presence || "Rauversion"

    address = Mail::Address.new
    address.address = email
    address.display_name = app_name
    address.format
  end

  def default_email_account
    ENV['EMAIL_ACCOUNT']
  end
end
