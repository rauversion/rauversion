class TenantsController < ApplicationController
  before_action :authenticate_user!

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
    membership = current_user.memberships.includes(:tenant).find_by!(tenant_id: params[:id])
    session[:tenant_id] = membership.tenant_id

    render json: {
      tenant: tenant_payload(membership),
      message: "Tenant activated"
    }
  end

  private

  def tenant_params
    params.require(:tenant).permit(:name, :slug)
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
      preview_url: tenant_preview_url(tenant)
    }
  end

  def tenant_preview_url(tenant)
    return request.base_url if tenant.central?

    if Rails.env.development?
      "#{request.protocol}#{tenant.slug}.lvh.me:#{request.port}"
    else
      "https://#{tenant.slug}.#{tenant_base_domain}"
    end
  end

  def availability_reason(valid:, reserved:, taken:)
    return "invalid" unless valid
    return "reserved" if reserved
    return "taken" if taken

    "available"
  end
end
