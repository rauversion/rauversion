class InterestAlertMailer < ApplicationMailer
  def notify_admin(interest_alert, admin)
    @interest_alert = interest_alert
    @user = interest_alert.user
    @admin = admin

    mail(
      to: @admin.email,
      subject: "New Role Request from #{@user.username}"
    )
  end
end
