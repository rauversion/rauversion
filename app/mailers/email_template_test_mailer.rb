class EmailTemplateTestMailer < ApplicationMailer
  layout false

  def test_email
    html = params[:html].to_s
    subject_line = params[:subject].to_s.strip

    mail(
      to: params[:to_email],
      subject: subject_line.start_with?("[TEST]") ? subject_line : "[TEST] #{subject_line.presence || 'Email de prueba'}"
    ) do |format|
      format.html { render html: html.html_safe, layout: false }
      format.text { render plain: plain_text_body(html), layout: false }
    end
  end

  private

  def plain_text_body(html)
    ActionController::Base.helpers.strip_tags(
      html.to_s
        .gsub(/<br\s*\/?>/i, "\n")
        .gsub(%r{</(p|div|h1|h2|h3|li|tr|section)>}i, "\n")
    ).squish
  end
end
