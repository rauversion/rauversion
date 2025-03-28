# Preview all emails at http://localhost:3000/rails/mailers/interest_alert_mailer_mailer
class InterestAlertMailerPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/interest_alert_mailer_mailer/notify_admin
  def notify_admin
    InterestAlertMailer.notify_admin
  end

end
