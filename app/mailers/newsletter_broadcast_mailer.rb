class NewsletterBroadcastMailer < ApplicationMailer
  def broadcast_email
    @html = params[:html].to_s
    @text = params[:text].to_s

    mail(to: params[:to_email], subject: params[:subject].to_s) do |format|
      format.html { render html: @html.html_safe }
      format.text { render plain: @text }
    end
  end
end
