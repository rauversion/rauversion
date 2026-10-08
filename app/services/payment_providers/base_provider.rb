module PaymentProviders
  class BaseProvider
    attr_reader :cart, :user, :purchase, :delivery_method

    def initialize(cart:, user:, purchase:, delivery_method: nil)
      @cart = cart
      @user = user
      @purchase = purchase
      @delivery_method = delivery_method.presence || "shipping"
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

    def delivery_selection_error
      return I18n.t("products.cart.invalid_delivery_method") unless ProductPurchase.delivery_methods.key?(delivery_method)
      if delivery_method == "local_pickup"
        return I18n.t("products.cart.pickup_unavailable") unless cart.pickup_available?
      elsif cart.requires_pickup?
        return I18n.t("products.cart.pickup_required")
      end
      nil
    end

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

    def platform_fee_rate
      ENV.fetch("PLATFORM_EVENTS_FEE", 10).to_d / 100
    end

    def platform_fee_for(amount)
      amount.to_d * platform_fee_rate
    end

    def service_fee_name
      "Cargo por servicio"
    end

    def service_fee_description(source_type)
      case source_type
      when "product"
        "Cargo de servicio de Rauversion para la compra de productos"
      when "event"
        "Cargo de servicio de Rauversion para la compra de tickets"
      when "course"
        "Cargo de servicio de Rauversion para la inscripción al curso"
      else
        "Cargo de servicio de Rauversion para la compra de música"
      end
    end
  end
end
