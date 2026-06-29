class ApplicationMailer < ActionMailer::Base
  helper ApplicationHelper

  default from: -> { default_email_account }
  layout "mailer"


  def default_email_account
    ENV['EMAIL_ACCOUNT']
  end
end
