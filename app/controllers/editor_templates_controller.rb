class EditorTemplatesController < ApplicationController
  before_action :authenticate_user!, only: [:create, :destroy]
  before_action :set_editor_template, only: [:destroy]

  def index
    templates = EditorTemplate
      .available_for(current_user)
      .for_category(params[:category])
      .ordered_for_editor

    render json: { templates: templates.map { |template| serialize_template(template) } }
  end

  def create
    template = current_user.editor_templates.new(editor_template_params)

    if template.save
      render json: { template: serialize_template(template) }, status: :created
    else
      render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @editor_template.destroy
    head :no_content
  end

  private

  def set_editor_template
    @editor_template = current_user.editor_templates.find(params[:id])
  end

  def editor_template_params
    payload = params.require(:editor_template)

    {
      name: payload[:name],
      description: payload[:description],
      thumbnail: payload[:thumbnail],
      category: payload[:category],
      page_data: normalize_page_data(payload[:page_data]),
    }
  end

  def normalize_page_data(page_data)
    return {} unless page_data.present?
    return page_data.to_unsafe_h if page_data.respond_to?(:to_unsafe_h)
    return page_data if page_data.is_a?(Hash)

    {}
  end

  def serialize_template(template)
    {
      id: template.id.to_s,
      name: template.name,
      description: template.description,
      thumbnail: template.thumbnail,
      category: template.category,
      userId: template.user_id,
      page: template.normalized_page_data,
    }
  end
end
