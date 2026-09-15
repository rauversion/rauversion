module TenantSubscriptions
  class StripeCheckout
    def initialize(tenant:, subscriber:, plan_price:, success_url:, cancel_url:)
      @tenant = tenant
      @subscriber = subscriber
      @plan_price = plan_price
      @success_url = success_url
      @cancel_url = cancel_url
    end

    def call
      raise ArgumentError, "This price is not available for checkout" unless plan_price.checkout_available?

      subscription = tenant.tenant_subscription || tenant.build_tenant_subscription(subscriber: subscriber)
      subscription.assign_attributes(
        subscriber: subscriber,
        plan: plan_price.plan,
        plan_price: plan_price,
        provider: plan_price.provider,
        status: "pending"
      )
      subscription.save!

      metadata = {
        source_type: "tenant_subscription",
        tenant_id: tenant.id.to_s,
        subscriber_id: subscriber.id.to_s,
        plan_price_id: plan_price.id.to_s
      }
      checkout_params = {
        mode: "subscription",
        line_items: [{ price: plan_price.provider_price_id, quantity: 1 }],
        success_url: success_url,
        cancel_url: cancel_url,
        client_reference_id: tenant.id.to_s,
        metadata: metadata,
        subscription_data: { metadata: metadata }
      }

      if subscription.provider_customer_id.present?
        checkout_params[:customer] = subscription.provider_customer_id
      else
        checkout_params[:customer_email] = subscriber.email
      end

      checkout = Stripe::Checkout::Session.create(checkout_params)
      subscription.update!(provider_checkout_session_id: checkout.id)
      checkout.url
    end

    private

    attr_reader :tenant, :subscriber, :plan_price, :success_url, :cancel_url
  end
end
