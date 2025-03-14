require 'base64'
require 'oauth2'
require 'omniauth-oauth2'
require 'securerandom'
require 'digest'

module OmniAuth
  module Strategies
    class MercadoPago < OmniAuth::Strategies::OAuth2
      option :name, 'mercado_pago'

      option :client_secret, ENV['MERCADO_PAGO_CLIENT_SECRET']
      option :redirect_uri, "https://chaskiq.sa.ngrok.io/users/auth/mercado_pago/callback"

      option :client_options, {
        site: 'https://auth.mercadopago.com',
        authorize_url: '/authorization',
        token_url: 'https://api.mercadopago.com/oauth/token',
        #token_url: 'https://chaskiq.sa.ngrok.io/oauth/token'
      }

      option :pkce, true
      option :authorize_options, [:scope, :response_type]

      uid { raw_info['user_id'] }

      info do
        {
          nickname: raw_info['nickname'],
          email: raw_info['email'],
          name: raw_info['first_name']
        }
      end

      extra do
        {
          raw_info: raw_info
        }
      end

      def authorize_params
        super.tap do |params|
          if options.pkce
            @code_verifier = SecureRandom.urlsafe_base64(64).tr('=', '')
            @code_challenge = generate_code_challenge(@code_verifier)
            
            params[:code_challenge] = @code_challenge
            params[:code_challenge_method] = 'S256'
          end

          session['omniauth.pkce.verifier'] = @code_verifier if @code_verifier
          session['omniauth.state'] = params[:state] if params[:state]
        end
      end

      def callback_phase
        super
      rescue NoMethodError => e
        fail!(:invalid_response, e)
      end

      def token_params
        super.tap do |params|
          if options.pkce && session['omniauth.pkce.verifier']
            params[:code_verifier] = session('omniauth.pkce.verifier') # session.delete('omniauth.pkce.verifier')
          end
          params[:test_token] = true
          params[:redirect_uri] = options.redirect_uri
          params[:client_id] = options.client_id if options.client_id
          params[:client_secret] = options.client_secret if options.client_secret
          params[:headers] = { 'Content-Type' => 'application/json' }
        end
      end

      #def build_access_token
      #  verifier = request.params["code"]
      #  # token_params = token_params.dup
      #  binding.pry
      #  client.auth_code.get_token(verifier, token_params, self.options)
      #end

      def build_access_token
        verifier = request.params["code"]
        
        client.auth_code.get_token(
          verifier,
          token_params.to_h, # Convert token_params to a hash
          { 'Content-Type' => 'application/json' } # Ensure headers are set
        )
      end

      private

      def generate_code_challenge(code_verifier)
        Base64.urlsafe_encode64(
          Digest::SHA256.digest(code_verifier)
        ).tr('=', '')
      end

      def raw_info
        hash = access_token.to_hash
        @raw_info ||= {
          user_id: hash['user_id'],
          public_key: hash['public_key'],
      }.with_indifferent_access
        # access_token.get("https://api.mercadopago.com/v1/customers/#{hash['user_id']}").parsed
      rescue ::OAuth2::Error => e
        raise e unless e.response.status == 400
        {}
      end

      def callback_url
        full_host + callback_path
      end
    end
  end
end
