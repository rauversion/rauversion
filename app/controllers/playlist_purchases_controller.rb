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

    provider = payment_provider.new(
      user: current_user,
      purchasable: @playlist,
      price_param: build_params[:price].to_f
    )

    result = provider.create_digital_checkout_session(source_type: "playlist")

    if result[:error].present?
      respond_to do |format|
        format.html { redirect_to @playlist, notice: result[:error] }
        format.json { render json: { error: result[:error] }, status: :unprocessable_entity }
      end
      return
    end

    respond_to do |format|
      format.html { render "create" }
      format.json { render json: { checkout_url: result[:checkout_url] } }
    end
  end

  private

  def payment_provider
    provider = params[:provider] || ENV['DEFAULT_PAYMENT_GATEWAY'] || 'stripe'
    case provider
    when 'mercado_pago'
      PaymentProviders::MercadoPagoProvider
    else
      PaymentProviders::StripeProvider
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
