class TenantsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_membership, only: [:show, :update, :activate]
  before_action :authorize_tenant_settings!, only: [:update]

  def index
    memberships = current_user.memberships
      .joins(:tenant)
      .includes(:tenant)
      .order("tenants.central DESC, tenants.name ASC")

    respond_to do |format|
      format.html { render inline: "", layout: "react" }
      format.json do
        render json: {
          current_tenant_id: Current.tenant.id,
          tenants: memberships.map { |membership| tenant_payload(membership) }
        }
      end
    end
  end

  def availability
    slug = Tenant.normalize_slug(params[:slug])
    valid = slug.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/) && slug.length.between?(3, 63)
    reserved = Tenant::RESERVED_SLUGS.include?(slug)
    taken = valid && Tenant.exists?(slug: slug)

    render json: {
      slug: slug,
      available: valid && !reserved && !taken,
      reason: availability_reason(valid: valid, reserved: reserved, taken: taken)
    }
  end

  def show
    respond_to do |format|
      format.html { render inline: "", layout: "react" }
      format.json { render json: { tenant: tenant_payload(@membership) } }
    end
  end

  def create
    tenant = Tenant.new(tenant_params)

    Tenant.transaction do
      tenant.save!
      tenant.memberships.create!(user: current_user, role: "owner")
    end

    render json: {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: "owner",
        subdomain: "#{tenant.slug}.#{tenant_base_domain}",
        url: "https://#{tenant.slug}.#{tenant_base_domain}"
      }
    }, status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.to_hash(true) }, status: :unprocessable_entity
  end

  def activate
    render json: {
      tenant: tenant_payload(@membership),
      message: "Tenant resolved by host"
    }
  end

  def update
    attributes = tenant_settings_params
    logo = attributes.delete(:logo)
    remove_logo = ActiveModel::Type::Boolean.new.cast(attributes.delete(:remove_logo))

    Tenant.transaction do
      @tenant.update!(attributes)
      @tenant.logo.attach(logo) if logo.present?
      @tenant.logo.purge if remove_logo && logo.blank? && @tenant.logo.attached?
    end

    render json: { tenant: tenant_payload(@membership.reload) }
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.to_hash(true) }, status: :unprocessable_entity
  rescue JSON::ParserError
    render json: { errors: { theme_schema: ["must be valid JSON"] } }, status: :unprocessable_entity
  end

  private

  def tenant_params
    params.require(:tenant).permit(:name, :slug)
  end

  def tenant_settings_params
    permitted = params.require(:tenant).permit(
      :name,
      :tagline,
      :template,
      :primary_color,
      :accent_color,
      :background_color,
      :heading_font,
      :theme_schema,
      :logo,
      :remove_logo,
      theme_schema: {}
    )

    if params[:tenant].key?(:theme_schema)
      value = params[:tenant][:theme_schema]
      permitted[:theme_schema] = value.is_a?(String) ? JSON.parse(value) : normalize_json_param(value)
    end

    permitted
  end

  def set_membership
    @membership = current_user.memberships.includes(:tenant).find_by!(tenant_id: params[:id])
    @tenant = @membership.tenant
  end

  def authorize_tenant_settings!
    return if @membership.role.in?(%w[owner admin])

    render json: { errors: { base: ["You cannot manage this tenant"] } }, status: :forbidden
  end

  def tenant_base_domain
    ENV.fetch("TENANT_BASE_DOMAIN", "rauversion.com")
  end

  def tenant_payload(membership)
    tenant = membership.tenant

    {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      central: tenant.central?,
      role: membership.role,
      preview_url: tenant_preview_url(tenant),
      admin_url: tenant_admin_url(tenant),
      can_manage_settings: membership.role.in?(%w[owner admin]),
      logo_url: tenant.logo.attached? ? url_for(tenant.logo) : nil,
      settings: {
        tagline: tenant.tagline,
        template: tenant.template,
        primary_color: tenant.primary_color,
        accent_color: tenant.accent_color,
        background_color: tenant.background_color,
        heading_font: tenant.heading_font,
        theme_schema: tenant.theme_schema
      }
    }
  end

  def tenant_preview_url(tenant)
    if Rails.env.development?
      host = tenant.central? ? "lvh.me" : "#{tenant.slug}.lvh.me"
      "#{request.protocol}#{host}:#{request.port}"
    else
      host = tenant.central? ? tenant_base_domain : "#{tenant.slug}.#{tenant_base_domain}"
      "https://#{host}"
    end
  end

  def tenant_admin_url(tenant)
    "#{tenant_preview_url(tenant)}/admin"
  end

  def availability_reason(valid:, reserved:, taken:)
    return "invalid" unless valid
    return "reserved" if reserved
    return "taken" if taken

    "available"
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
end
