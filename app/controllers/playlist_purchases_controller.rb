class PlaylistPurchasesController < ApplicationController
  before_action :authenticate_user!

  def new
    @playlist = Playlist.friendly.find(params[:playlist_id])
    @payment = Payment.new
    @payment.assign_attributes(initial_price: @playlist.price)
    @purchase = current_user.purchases.new
  end

  def create
    @playlist = Playlist.friendly.find(params[:playlist_id])
    @payment = Payment.new
    @payment.assign_attributes(build_params)

    customer = current_user

    price = @playlist.price
    price_param = build_params[:price].to_f
    if @playlist.name_your_price? && price_param && price_param > @playlist.price.to_f
      price = price_param
    end

    @purchase = current_user.purchases.new(purchasable: @playlist, price: price)

    @purchase.virtual_purchased = [
      VirtualPurchasedItem.new({resource: @playlist, quantity: 1})
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
    account = @playlist.user.oauth_credentials.find_by(provider: "stripe_connect")
    Stripe.stripe_account = account.uid unless account.blank?

    ActiveRecord::Base.transaction do
      @purchase.store_items
      @purchase.save

      line_items = [{
        "quantity" => 1,
        "price_data" => {
          "unit_amount" => (@purchase.price * 100).to_i,
          "currency" => "USD",
          "product_data" => {
            "name" => @playlist.title,
            "description" => "#{@playlist.title} from #{@playlist.user.username}"
          }
        }
      }]

      fee_amount = ENV.fetch('PLATFORM_EVENTS_FEE', 3).to_i

      payment_intent_data = {}

      if account
        payment_intent_data = {
          application_fee_amount: fee_amount
        }
      end

      @session = Stripe::Checkout::Session.create(
        payment_method_types: ["card"],
        line_items: line_items,
        payment_intent_data: payment_intent_data,
        customer_email: current_user.email,
        mode: "payment",
        success_url: checkout_success_url(purchase_id: @purchase.id),
        cancel_url: checkout_failure_url,
        client_reference_id: @purchase.id.to_s,
        tax_id_collection: {enabled: true},
        metadata: { 
          purchase_id: @purchase.id,
          source_type: "playlist"
        }
      )

      @purchase.update(
        checkout_type: "stripe",
        checkout_id: @session["id"]
      )

      @payment_url = @session["url"]
    end
  end

  def success
    @playlist = Playlist.friendly.find(params[:playlist_id])
    @purchase = current_user.purchases.find(params[:id])

    if params[:enc].present?
      decoded_purchase = Purchase.find_signed(CGI.unescape(params[:enc]))
      @purchase.complete_purchase! if decoded_purchase.id == @purchase.id
    end

    render "show"
  end

  def failure
    @playlist = Playlist.friendly.find(params[:playlist_id])
    @purchase = current_user.purchases.find(params[:id])
    render "show"
  end

  private

  def build_params
    params.require(:payment).permit(
      :include_message, :optional_message, :price
    )
  end
end
