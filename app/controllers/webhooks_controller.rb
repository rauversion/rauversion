class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token

  def create
    handle_webhook(provider: params[:provider])
  end

  def handle_webhook(provider:)
    case provider
    when "stripe" then handle_stripe
    when "mercadopago" then handle_mercadopago
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

  def handle_mercadopago
    payload = request.body.read
    json_event = JSON.parse(payload)

    # Verify webhook signature
    x_signature = request.headers["HTTP_X_SIGNATURE"]
    x_request_id = request.headers["HTTP_X_REQUEST_ID"]
    data_id = params["data.id"]&.downcase

    return render json: { error: "Missing required headers or params" }, status: :unauthorized if x_signature.blank? || x_request_id.blank? || data_id.blank?
    return render json: { error: "Invalid signature" }, status: :unauthorized unless valid_mercadopago_signature?(x_signature, x_request_id, data_id)

    begin
      sdk = Mercadopago::SDK.new(ENV["MERCADO_PAGO_ACCESS_TOKEN"])
      
      case json_event["action"]
      when "payment.created", "payment.updated"
        payment_id = json_event["data"]["id"]
        payment = sdk.payment.get(payment_id)
        
        if payment[:status] == 200
          payment_info = payment[:response]
          
          case payment_info["status"]
          when "approved"
            # Handle successful payment
            handle_mercadopago_purchase(payment_info)
          when "cancelled", "rejected", "refunded"
            # Handle failed payment
            handle_mercadopago_failure(payment_info)
          end
        end
      end

      render json: { status: :ok }
    rescue => e
      Rails.logger.error("MercadoPago webhook error: #{e.message}")
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def confirm_stripe_purchase(event_object)
    if event_object&.metadata&.source_type == "product"
      handle_product_purchase(event_object&.metadata)
    elsif event_object&.metadata&.source_type == "track"
      handle_track_purchase(event_object&.metadata)
    elsif event_object&.metadata&.source_type == "playlist"
      handle_playlist_purchase(event_object&.metadata)
    else
      purchase = Purchase.find_by(checkout_type: "stripe", checkout_id: event_object.id)
      if purchase.present?
        purchase.complete_purchase!
      end
    end
  end

  def handle_track_purchase(event_object)
    purchase = Purchase.find(event_object.purchase_id)
    purchase.complete_purchase! if purchase.present?
  end

  def handle_playlist_purchase(event_object)
    purchase = Purchase.find(event_object.purchase_id)
    purchase.complete_purchase! if purchase.present?
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
      else
        @purchase.update(status: :failed)
      end
    end
  end

  private

  def valid_mercadopago_signature?(x_signature, x_request_id, data_id)
    return false if ENV["MERCADO_PAGO_VERIFIER"].blank?

    # Extract timestamp and signature from x-signature header
    signature_parts = x_signature.split(',').map { |part| part.split('=') }.to_h
    timestamp = signature_parts['ts']
    received_signature = signature_parts['v1']

    return false if timestamp.blank? || received_signature.blank?

    # Create validation string according to MercadoPago's format
    validation_string = "id:#{data_id};request-id:#{x_request_id};ts:#{timestamp};"

    # Generate hash using the same algorithm as MercadoPago
    expected_signature = OpenSSL::HMAC.hexdigest(
      OpenSSL::Digest.new('sha256'),
      ENV["MERCADO_PAGO_VERIFIER"],
      validation_string
    )
    
    # Compare signatures using secure comparison
    ActiveSupport::SecurityUtils.secure_compare(expected_signature, received_signature)
  end

  def handle_mercadopago_purchase(payment_info)
    external_reference = payment_info["external_reference"]
    return unless external_reference

    purchase = Purchase.find_by(checkout_type: "mercadopago", checkout_id: external_reference)
    return unless purchase&.pending?

    purchase.update(
      status: :completed,
      total_amount: payment_info["transaction_amount"],
      payment_intent_id: payment_info["id"],
      payment_method: payment_info["payment_method_id"],
      installments: payment_info["installments"]
    )

    case purchase.purchasable_type
    when "Product"
      handle_mercadopago_product_purchase(purchase, payment_info)
    when "Track"
      purchase.complete_purchase!
    when "Playlist"
      purchase.complete_purchase!
    end
  end

  def handle_mercadopago_product_purchase(purchase, payment_info)
    return unless purchase.is_a?(ProductPurchase)

    additional_info = payment_info["additional_info"]
    return unless additional_info.present?

    # Update shipping information
    if additional_info["shipments"].present?
      receiver_address = additional_info["shipments"]["receiver_address"]
      purchase.update(
        shipping_address: {
          street_name: receiver_address["street_name"],
          street_number: receiver_address["street_number"],
          zip_code: receiver_address["zip_code"],
          city: receiver_address["city_name"],
          state: receiver_address["state_name"]
        },
        shipping_name: "#{additional_info["payer"]["first_name"]} #{additional_info["payer"]["last_name"]}",
        phone: "#{additional_info["payer"]["phone"]["area_code"]}#{additional_info["payer"]["phone"]["number"]}"
      )
    end

    # Create purchase items from the additional_info items
    items = additional_info["items"]
    return unless items.present?

    purchase.product_purchase_items.create(items.map { |item|
      product = Product.find_by(id: item["id"])
      next unless product

      {
        product: product,
        quantity: item["quantity"],
        price: item["unit_price"],
        title: item["title"],
        description: item["description"]
      }
    }.compact)

    purchase.product_purchase_items.each do |item|
      item.product.decrease_quantity(item.quantity)
    end

    ProductPurchaseMailer.purchase_confirmation(purchase).deliver_later
  end

  def handle_mercadopago_failure(payment_info)
    external_reference = payment_info["external_reference"]
    return unless external_reference

    purchase = Purchase.find_by(checkout_type: "mercadopago", checkout_id: external_reference)
    return unless purchase&.pending?

    purchase.update(
      status: :failed,
      payment_intent_id: payment_info["id"]
    )
  end
end
