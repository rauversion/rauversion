class TrackPurchasesController < ApplicationController
  before_action :authenticate_user!

  def new
    @track = Track.friendly.find(params[:track_id])
    @payment = Payment.new
    @payment.assign_attributes(initial_price: @track.price)
    @purchase = current_user.purchases.new
  end

  def create
    @track = Track.friendly.find(params[:track_id])
    @payment = Payment.new
    @payment.assign_attributes(build_params)

    # When a customer purchases a ticket for an event:
    customer = current_user

    price = @track.price
    price_param = build_params[:price].to_f
    if @track.name_your_price? && price_param && price_param > @track.price
      price = price_param
    end

    @purchase = current_user.purchases.new(purchasable: @track, price: price)

    @purchase.virtual_purchased = [
      VirtualPurchasedItem.new({resource: @track, quantity: 1})
    ]

    handle_stripe_session

    respond_to do |format|
      format.html { render "create" }
      format.json { 
        render json: {
          checkout_url: @payment_url
        }
      }
    end
  end

  def handle_stripe_session
    # @purchase.errors.add(:base, "hahahaha")
    account = @track.user.oauth_credentials.find_by(provider: "stripe_connect")
    Stripe.stripe_account = account.uid unless account.blank?

    ActiveRecord::Base.transaction do
      @purchase.store_items
      @purchase.save

      line_items = @purchase.purchased_items.group(:purchased_item_id).count.map do |k, v|
        {
          "quantity" => 1,
          "price_data" => {
            "unit_amount" => ((@purchase.price * v) * 100).to_i,
            "currency" => "USD",
            "product_data" => {
              "name" => @track.title,
              "description" => "#{@track.title} from #{@track.user.username}"
            }
          }
        }
      end

      puts line_items

      fee_amount = ENV.fetch('PLATFORM_EVENTS_FEE', 3).to_i

      payment_intent_data = {}

      if account
        payment_intent_data = {
          application_fee_amount: fee_amount
          # "transfer_data"=> %{
          #  "destination"=> c.uid
          # }
        }
      end

      @session = Stripe::Checkout::Session.create(
        payment_method_types: ["card"],
        line_items: line_items,
        payment_intent_data: payment_intent_data,
        customer_email: current_user.email,

        success_url: checkout_success_url(purchase_id: @purchase.id),
        cancel_url: checkout_failure_url,
        client_reference_id: @purchase.id.to_s,
        customer_email: current_user.email,
        tax_id_collection: {enabled: true},
        metadata: { 
          purchase_id: @purchase.id,
          # cart_id: @cart.id,
          source_type: "track"
        },
        mode: "payment",
        #success_url: success_track_track_purchase_url(@track, @purchase), # Replace with your success URL
        #cancel_url: failure_track_track_purchase_url(@track, @purchase)   # Replace with your cancel URL
      )

      @purchase.update(
        checkout_type: "stripe",
        checkout_id: @session["id"]
      )

      @payment_url = @session["url"]
    end
  end

  def success
    @track = Track.friendly.find(params[:track_id])
    @purchase = current_user.purchases.find(params[:id])

    if params[:enc].present?
      decoded_purchase = Purchase.find_signed(CGI.unescape(params[:enc]))
      @purchase.complete_purchase! if decoded_purchase.id = @purchase.id
    end

    render "show"
  end

  def failure
    @track = Track.friendly.find(params[:track_id])
    @purchase = current_user.purchases.find(params[:id])
    render "show"
  end

  def build_params
    params.require(:payment).permit(
      :include_message, :optional_message, :price
    )
  end
end
