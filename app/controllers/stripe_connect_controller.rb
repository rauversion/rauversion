class StripeConnectController < ApplicationController
  before_action :authenticate_user!

  def show
    begin
      if current_user.stripe_account_id.present?
        account_link = Stripe::AccountLink.create({
          account: current_user.stripe_account_id,
          refresh_url: reauth_stripe_connect_url,
          return_url: return_stripe_connect_url,
          type: 'account_onboarding',
        })
        render json: { url: account_link.url }
      else
        render json: { url: stripe_connect_path }, status: :ok
      end
    rescue Stripe::StripeError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def create
    begin
      country = params[:country]
      unless country.present?
        render json: { error: "Country is required" }, status: :unprocessable_entity
        return
      end

      return render json: {error: "already connected"}, status: 422 if current_user.stripe_account_id.present?

      account = Stripe::Account.create({
        country: country,
        type: 'express',
        capabilities: {
          transfers: { requested: true },
        },
        tos_acceptance: {service_agreement: 'recipient'},
      })

      #Stripe::Account.create({
      #  country: 'CL',
      #  type: 'custom',
      #  capabilities: {transfers: {requested: true}},
      #  tos_acceptance: {service_agreement: 'recipient'},
      #}) 
      
      # Stripe::Account.create({
      #   country: 'CL',
      #   controller: {
      #     stripe_dashboard: {type: 'none'},
      #     fees: {payer: 'application'},
      #     losses: {payments: 'application'},
      #     requirement_collection: 'application',
      #   },
      #   capabilities: {
      #     transfers: {requested: true}
      #   },
      #   tos_acceptance: {service_agreement: 'recipient'},
      # })

      account_link = Stripe::AccountLink.create({
        account: account.id,
        refresh_url: reauth_stripe_connect_url,
        return_url: return_stripe_connect_url,
        type: 'account_onboarding',
      })

      # Store the account ID in the user's record for future reference
      current_user.update(stripe_account_id: account.id)

      render json: { url: account_link.url }
    rescue Stripe::StripeError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  def reauth
    # Handle reauthorization
    if current_user.stripe_account_id.present?
      begin
        account_link = Stripe::AccountLink.create({
          account: current_user.stripe_account_id,
          refresh_url: stripe_connect_reauth_url,
          return_url: stripe_connect_return_url,
          type: 'account_onboarding',
        })
        redirect_to account_link.url, allow_other_host: true
      rescue Stripe::StripeError => e
        flash[:error] = "An error occurred: #{e.message}"
        redirect_to root_path
      end
    else
      flash[:error] = "No Stripe account found"
      redirect_to root_path
    end
  end

  def return
    # Handle successful return from Stripe onboarding
    flash[:success] = "Your Stripe account has been connected successfully!"
    redirect_to root_path
  end

  def status
    begin
      if current_user.stripe_account_id.present?
        account = Stripe::Account.retrieve(current_user.stripe_account_id)
        render json: {
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements
        }
      else
        render json: { error: "No Stripe account connected" }, status: :unprocessable_entity
      end
    rescue Stripe::StripeError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end
