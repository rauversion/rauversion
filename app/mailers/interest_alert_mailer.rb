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

  def notify_approval(interest_alert)
    @interest_alert = interest_alert
    @user = interest_alert.user

    mail(
      to: @user.email,
      subject: "Rauversion: Your #{@interest_alert.role.titleize} Role Request Has Been Approved"
    )
  end
end
