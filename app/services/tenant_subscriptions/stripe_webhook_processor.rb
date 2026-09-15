module TenantSubscriptions
  class StripeWebhookProcessor
    SUBSCRIPTION_EVENTS = %w[
      customer.subscription.created
      customer.subscription.updated
      customer.subscription.deleted
      invoice.paid
      invoice.payment_failed
    ].freeze

    def self.handles?(event)
      return true if event.type.in?(SUBSCRIPTION_EVENTS)
      return false unless event.type == "checkout.session.completed"

      checkout = event.data.object
      metadata = checkout.respond_to?(:metadata) ? checkout.metadata : checkout[:metadata]
      source_type = metadata.respond_to?(:source_type) ? metadata.source_type : metadata&.[](:source_type) || metadata&.[]("source_type")

      source_type == "tenant_subscription"
    end

    def self.call(event)
      new(event).call
    end

    def initialize(event)
      @event = event
    end

    def call
      billing_event = BillingEvent.find_or_initialize_by(
        provider: "stripe",
        provider_event_id: event.id
      )
      return if billing_event.processed?

      billing_event.assign_attributes(event_type: event.type, payload: event.to_hash)
      billing_event.save!

      process_event
      billing_event.update!(processed_at: Time.current, processing_error: nil)
    rescue StandardError => error
      billing_event&.update_columns(processing_error: error.message, updated_at: Time.current)
      raise
    end

    private

    attr_reader :event

    def process_event
      case event.type
      when "checkout.session.completed"
        process_checkout(event.data.object)
      when "customer.subscription.created", "customer.subscription.updated"
        sync_subscription(event.data.object)
      when "customer.subscription.deleted"
        sync_subscription(event.data.object, forced_status: "canceled")
      when "invoice.paid"
        sync_invoice_subscription(event.data.object, payment_failed: false)
      when "invoice.payment_failed"
        sync_invoice_subscription(event.data.object, payment_failed: true)
      end
    end

    def process_checkout(checkout)
      subscription = TenantSubscription.find_by!(provider_checkout_session_id: checkout.id)
      subscription.update!(
        provider_customer_id: checkout.customer,
        provider_subscription_id: checkout.subscription
      )
      sync_subscription(Stripe::Subscription.retrieve(checkout.subscription))
    end

    def sync_invoice_subscription(invoice, payment_failed:)
      return if invoice.subscription.blank?

      stripe_subscription = Stripe::Subscription.retrieve(invoice.subscription)
      subscription = find_subscription(stripe_subscription)
      if payment_failed
        subscription.update!(
          status: "past_due",
          grace_period_ends_at: subscription.grace_period_ends_at.presence || 7.days.from_now
        )
      else
        sync_subscription(stripe_subscription)
        subscription.update!(grace_period_ends_at: nil)
      end
    end

    def sync_subscription(stripe_subscription, forced_status: nil)
      subscription = find_subscription(stripe_subscription)
      subscription.update!(
        provider_customer_id: stripe_subscription.customer,
        provider_subscription_id: stripe_subscription.id,
        status: forced_status || stripe_subscription.status,
        trial_ends_at: time_from_unix(stripe_subscription.trial_end),
        current_period_starts_at: time_from_unix(stripe_subscription.current_period_start),
        current_period_ends_at: time_from_unix(stripe_subscription.current_period_end),
        cancel_at_period_end: stripe_subscription.cancel_at_period_end || false,
        canceled_at: time_from_unix(stripe_subscription.canceled_at)
      )
    end

    def find_subscription(stripe_subscription)
      TenantSubscription.find_by(provider_subscription_id: stripe_subscription.id) ||
        TenantSubscription.find_by!(tenant_id: stripe_subscription.metadata&.tenant_id)
    end

    def time_from_unix(value)
      Time.zone.at(value) if value.present?
    end
  end
end
