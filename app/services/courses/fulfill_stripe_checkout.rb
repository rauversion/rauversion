module Courses
  class FulfillStripeCheckout
    def self.call(session)
      return unless session.payment_status == "paid"

      purchase = ProductPurchase.find_by(id: session.metadata.purchase_id, stripe_session_id: session.id)
      return unless purchase

      purchase.with_lock do
        return unless purchase.pending?

        item = purchase.product_purchase_items.sole
        product = item.product
        return unless product.is_a?(Products::CourseProduct) && product.course_id.to_s == session.metadata.course_id.to_s
        return unless session.currency == purchase.currency && session.payment_intent.present?

        multiplier = %w[bif clp djf gnf jpy kmf krw mga pyg rwf ugx vnd vuv xaf xof xpf].include?(purchase.currency) ? 1 : 100
        return unless session.amount_total == (purchase.total_amount * multiplier).round.to_i

        purchase.update!(status: :completed, payment_intent_id: session.payment_intent)
        product.set_course_enrollment_for(item, purchase)
      end
    end
  end
end
