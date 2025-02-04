class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    handle_webhook(provider: params[:provider])
  end

  def handle_webhook(provider:)
    case provider
    when "stripe" then handle_stripe
    else
      render json: {status: :nok}, status: 422
    end
  end

  def handle_stripe
    payload = request.body.read
    sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
    event = nil
    json_event = JSON.parse(payload)
    begin
      event = if json_event["account"]
        Stripe::Webhook.construct_event(payload, sig_header, ENV["STRIPE_SIGNING_SECRET"])
      else
        Stripe::Webhook.construct_event(payload, sig_header, ENV["STRIPE_SIGNING_SECRET_ACC"])
      end
    rescue JSON::ParserError => e
      # Invalid payload
      render json: {error: {message: e.message}}, status: :bad_request
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      render json: {error: {message: e.message, extra: "Sig verification failed"}}, status: :bad_request
      return
    end

    # Handle the event
    case event.type
    when "payment_intent.succeeded"
      payment_intent = event.data.object # contains a Stripe::PaymentIntent
      puts "PaymentIntent was successful!"
    when "checkout.session.completed"
      confirm_stripe_purchase(event.data.object)
    when "payment_method.attached"
      payment_method = event.data.object # contains a Stripe::PaymentMethod
      puts "PaymentMethod was attached to a Customer!"
      # ... handle other event types
    else
      puts "Unhandled event type: #{event.type}"
    end

    render json: {message: :success}
  end

  def confirm_stripe_purchase(event_object)

    if event_object&.metadata&.source_type == "product"

      handle_product_purchase(event_object&.metadata)

    else

      purchase = Purchase.find_by(checkout_type: "stripe", checkout_id: event_object.id)
      if purchase.present?
        purchase.complete_purchase!
      end

    end
  end


  def handle_product_purchase(event_object)
    @purchase = ProductPurchase.find(event_object.purchase_id)
    
    if @purchase.pending?
      stripe_session = Stripe::Checkout::Session.retrieve(@purchase.stripe_session_id)
      
      if stripe_session.payment_status == 'paid'
        shipping_cost = stripe_session.shipping_cost.amount_total / 100.0 rescue 0
        total_amount = stripe_session.amount_total / 100.0
  
        payment_intent = Stripe::PaymentIntent.retrieve(stripe_session.payment_intent)

        @purchase.update(
          status: :completed,
          shipping_address: stripe_session&.shipping_details&.address&.to_h,
          shipping_name: stripe_session&.shipping_details&.name,
          phone: stripe_session&.customer_details&.phone,
          shipping_cost: shipping_cost,
          total_amount: total_amount,
          payment_intent_id: payment_intent["id"]
        )
        
        cart = ProductCart.find(stripe_session.metadata.cart_id)
        
        @purchase.product_purchase_items.create(cart.product_cart_items.map { |item|
          product = item.product
          shipping = nil
          additional_shipping_cost = 0
          if stripe_session.shipping_details.present?
            shipping = product.product_shippings.find_by(country: stripe_session.shipping_details.address.country) ||
                      product.product_shippings.find_by(country: 'Rest of World')
            
            additional_shipping_cost = shipping ? (item.quantity - 1) * shipping.additional_cost.to_i : 0
          end
          {
            product: product,
            quantity: item.quantity,
            price: product.price,
            shipping_cost: (shipping&.base_cost || 0) + additional_shipping_cost
          }
        })
  
        @purchase.product_purchase_items.each do |item|
          item.product.decrease_quantity(item.quantity)
        end
  
        ProductPurchaseMailer.purchase_confirmation(@purchase).deliver_later
  
        cart.product_cart_items.destroy_all
        
        #redirect_to root_path, notice: 'Payment successful! Thank you for your purchase.'
      else
        @purchase.update(status: :failed)
        #redirect_to product_cart_path, alert: 'Payment was not successful. Please try again.'
      end
    else
      #redirect_to root_path, notice: 'This purchase has already been processed.'
    end
  end
end
