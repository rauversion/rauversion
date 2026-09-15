class TenantBillingController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_billing_manager!

  def show
    respond_to do |format|
      format.html { render inline: "", layout: "react" }
      format.json { render json: billing_payload }
    end
  end

  def checkout
    return render json: { error: "Subscriptions are disabled" }, status: :unprocessable_entity if TenantSubscriptions.disabled?
    return render json: { error: "The central tenant does not require a subscription" }, status: :unprocessable_entity if Current.tenant.central?

    plan_price = PlanPrice.available.includes(:plan).find(params[:plan_price_id])
    checkout_url = TenantSubscriptions::StripeCheckout.new(
      tenant: Current.tenant,
      subscriber: current_user,
      plan_price: plan_price,
      success_url: billing_url(checkout: "success"),
      cancel_url: billing_url(checkout: "canceled")
    ).call

    render json: { checkout_url: checkout_url }
  rescue ActiveRecord::RecordInvalid, Stripe::StripeError, ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  def portal
    subscription = Current.tenant.tenant_subscription
    return render json: { error: "No Stripe customer exists for this tenant" }, status: :unprocessable_entity if subscription&.provider_customer_id.blank?

    portal = Stripe::BillingPortal::Session.create(
      customer: subscription.provider_customer_id,
      return_url: billing_url
    )
    render json: { portal_url: portal.url }
  rescue Stripe::StripeError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  private

  def authorize_billing_manager!
    return if current_user.admin? && Current.tenant.central?
    return if Current.membership&.role.in?(%w[owner admin])

    render json: { error: "Forbidden" }, status: :forbidden
  end

  def billing_payload
    policy = Current.tenant.access_policy
    subscription = Current.tenant.tenant_subscription

    {
      tenant: {
        id: Current.tenant.id,
        name: Current.tenant.name,
        slug: Current.tenant.slug,
        central: Current.tenant.central?
      },
      disabled: TenantSubscriptions.disabled?,
      accessible: policy.accessible?,
      subscription: serialize_subscription(subscription),
      plans: Plan.available.includes(:plan_prices).map { |plan| serialize_plan(plan) }
    }
  end

  def serialize_plan(plan)
    {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      entitlements: plan.entitlements,
      prices: plan.plan_prices.available.map do |price|
        {
          id: price.id,
          currency: price.currency.upcase,
          amount_cents: price.amount_cents,
          billing_interval: price.billing_interval,
          checkout_available: price.checkout_available?
        }
      end
    }
  end

  def serialize_subscription(subscription)
    return nil if subscription.blank?

    {
      id: subscription.id,
      status: subscription.status,
      plan_code: subscription.plan.code,
      plan_name: subscription.plan.name,
      current_period_ends_at: subscription.current_period_ends_at,
      trial_ends_at: subscription.trial_ends_at,
      cancel_at_period_end: subscription.cancel_at_period_end,
      grace_period_ends_at: subscription.grace_period_ends_at,
      portal_available: subscription.provider_customer_id.present?
    }
  end
end
