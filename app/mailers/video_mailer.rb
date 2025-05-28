class VideoMailer < ApplicationMailer
  def video_ready
    @user = params[:user]
    @video_url = params[:video_url]
    mail(
      to: @user.email,
      subject: "Your generated video is ready!"
    )
  end
end
