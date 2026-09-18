module PaymentProviders
  class CourseStripeProvider < StripeProvider
    attr_reader :course

    def initialize(course:, user:)
      @course = course
      super(user: user)
    end

    def create_checkout_session
      return { error: I18n.t("courses.enrollment_form.enrollment_closed") } unless course.self_enrollment? && course.paid_enrollment?
      return { error: I18n.t("courses.enrollment_form.stripe_unavailable") } if course.user.stripe_account_id.blank?

      @purchase = user.product_purchases.pending.joins(:product_purchase_items)
        .where(product_purchase_items: { product_id: course.course_product.id })
        .where.not(stripe_session_id: [nil, ""]).order(created_at: :desc).first
      if purchase
        previous_session = Stripe::Checkout::Session.retrieve(purchase.stripe_session_id)
        return { checkout_url: previous_session.url } if previous_session.status == "open"
        if previous_session.payment_status == "paid"
          Courses::FulfillStripeCheckout.call(previous_session)
          enrollment = course.course_enrollments.find_by(user: user)
          return enrollment ? { enrollment: enrollment } : { error: I18n.t("courses.enrollment_form.payment_pending") }
        end
        unless previous_session.status == "expired"
          return { error: I18n.t("courses.enrollment_form.payment_pending") }
        end
        purchase.update!(status: :failed)
      end

      currency = course.currency
      amount = stripe_amount(course.price, currency)
      fee = (amount * platform_fee_rate).to_i
      @purchase = user.product_purchases.create!(
        status: :pending, currency: currency, total_amount: decimal_amount(amount + fee, currency)
      )
      purchase.product_purchase_items.create!(
        product: course.course_product, quantity: 1, price: course.price, currency: currency, shipping_cost: 0
      )

      session = Stripe::Checkout::Session.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: user.email,
        client_reference_id: purchase.id.to_s,
        line_items: [{
          "quantity" => 1,
          "price_data" => {
            "currency" => currency, "unit_amount" => amount,
            "product_data" => { "name" => course.title }
          }
        }] + build_service_fee_line_items(fee, currency, "course"),
        payment_intent_data: {
          application_fee_amount: fee,
          transfer_data: { destination: course.user.stripe_account_id }
        },
        metadata: { source_type: "course", purchase_id: purchase.id, course_id: course.id },
        success_url: Rails.application.routes.url_helpers.course_url(course, checkout: "success"),
        cancel_url: Rails.application.routes.url_helpers.course_url(course, checkout: "cancelled")
      }, { idempotency_key: "course-checkout-#{purchase.id}" })

      purchase.update!(stripe_session_id: session.id)
      { checkout_url: session.url }
    rescue Stripe::StripeError => e
      purchase.update!(status: :failed) if purchase && purchase.stripe_session_id.blank?
      Rails.logger.warn("Course checkout failed: #{e.class}")
      { error: I18n.t("courses.enrollment_form.checkout_error") }
    end

    def quote
      currency = course.currency
      subtotal = stripe_amount(course.price, currency)
      fee = (subtotal * platform_fee_rate).to_i
      {
        currency: currency,
        subtotal: decimal_amount(subtotal, currency),
        service_fee: decimal_amount(fee, currency),
        total: decimal_amount(subtotal + fee, currency)
      }
    end

    private

    def decimal_amount(amount, currency)
      amount.to_d / (zero_decimal_currency?(currency) ? 1 : 100)
    end
  end
end
