class EmailTemplatesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_email_template, only: [:show, :edit, :update, :destroy]

  def index
    @email_templates = current_user.email_templates.order(updated_at: :desc)

    respond_to do |format|
      format.json { render json: { templates: @email_templates.map { |template| serialize_email_template(template) } } }
      format.html { render_blank }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: { template: serialize_email_template(@email_template) } }
      format.html { render_blank }
    end
  end

  def edit
    render_blank
  end

  def create
    @email_template = current_user.email_templates.new(email_template_params)

    if @email_template.save
      render json: { template: serialize_email_template(@email_template) }, status: :created
    else
      render json: { errors: @email_template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @email_template.update(email_template_params)
      render json: { template: serialize_email_template(@email_template) }
    else
      render json: { errors: @email_template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @email_template.destroy
    head :no_content
  end

  def preview
    mjml = params[:mjml].to_s

    if mjml.blank?
      render json: { errors: ["MJML content is required"] }, status: :unprocessable_entity
      return
    end

    result = MjmlCompiler.compile(mjml)
    render json: result
  rescue MjmlCompiler::CompilationError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def test_send
    to_email = params[:to_email].to_s.strip
    mjml = params[:mjml].to_s
    subject = params[:subject].to_s.strip.presence || "Email de prueba"

    unless to_email.match?(URI::MailTo::EMAIL_REGEXP)
      render json: { errors: ["Ingresa un correo valido"] }, status: :unprocessable_entity
      return
    end

    if mjml.blank?
      render json: { errors: ["MJML content is required"] }, status: :unprocessable_entity
      return
    end

    result = MjmlCompiler.compile(mjml)
    warnings = normalize_mjml_errors(result["errors"])

    EmailTemplateTestMailer.with(
      to_email: to_email,
      subject: subject,
      html: result["html"].to_s
    ).test_email.deliver_now

    render json: {
      status: "sent",
      message: "Correo de prueba enviado a #{to_email}",
      warnings: warnings,
    }
  rescue MjmlCompiler::CompilationError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error("Email template test send failed: #{e.class} - #{e.message}")
    render json: { errors: [e.message.presence || "No se pudo enviar el correo de prueba"] }, status: :internal_server_error
  end

  private

  def set_email_template
    @email_template = current_user.email_templates.find(params[:id])
  end

  def email_template_params
    permitted = params.fetch(:email_template, {}).permit(:name, :subject, :preheader, :published)

    if params[:email_template]&.key?(:document)
      permitted[:document] = normalize_json_param(params[:email_template][:document])
    end

    permitted
  end

  def normalize_json_param(value)
    case value
    when ActionController::Parameters
      value.to_unsafe_h.transform_values { |item| normalize_json_param(item) }
    when Array
      value.map { |item| normalize_json_param(item) }
    else
      value
    end
  end

  def normalize_mjml_errors(errors)
    Array(errors).map do |error|
      next error if error.is_a?(String)
      error.respond_to?(:[]) ? error["message"].presence || error[:message].presence || error.to_json : error.to_s
    end.compact
  end

  def serialize_email_template(template)
    {
      id: template.id.to_s,
      name: template.name,
      subject: template.subject,
      preheader: template.preheader,
      published: template.published,
      document: template.normalized_document,
      updatedAt: template.updated_at,
      createdAt: template.created_at,
    }
  end
end
