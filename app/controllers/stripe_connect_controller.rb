class StripeConnectController < ApplicationController
  before_action :authenticate_user!

  def create
    begin
      account = Stripe::Account.create({
        country: 'CL',
        type: 'express',
        capabilities: {
          # card_payments: { requested: true },
          transfers: { requested: true },
        },
        tos_acceptance: {service_agreement: 'recipient'},
        #business_type: 'individual',
        #business_profile: { url: 'https://rauversion.com' },
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

      redirect_to account_link.url, allow_other_host: true
    rescue Stripe::StripeError => e
      flash[:error] = "An error occurred: #{e.message}"
      redirect_to root_path
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
end
