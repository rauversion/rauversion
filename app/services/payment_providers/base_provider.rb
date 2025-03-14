module PaymentProviders
  class BaseProvider
    attr_reader :cart, :user, :purchase

    def initialize(cart:, user:, purchase:)
      @cart = cart
      @user = user
      @purchase = purchase
    end

    def create_checkout_session(promo_code: nil)
      raise NotImplementedError, "#{self.class} must implement #create_checkout_session"
    end

    def success_url(options = {})
      raise NotImplementedError, "#{self.class} must implement #success_url"
    end

    def cancel_url
      raise NotImplementedError, "#{self.class} must implement #cancel_url"
    end

    protected

    def validate_cart!
      return false if cart.product_cart_items.empty?
      true
    end

    def validate_promo_code!(promo_code)
      return true if promo_code.blank?
      
      cart.product_cart_items.map(&:product).each do |product|
        return false if product.coupon&.code != promo_code
      end
      true
    end
  end
end
