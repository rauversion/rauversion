class WebhookWorkerJob < ApplicationJob
  queue_as :default

  def perform(product_purchase_id)
    product_purchase = ProductPurchase.find_by(id: product_purchase_id)
    return unless product_purchase

    # 1. Send purchase confirmation mail
    product_purchase.notify_buyers
    
    # 1b. Send sell confirmation mail to each unique seller
    product_purchase.notify_sellers

    # 2. Set service booking
    product_purchase.set_service_booking

    product_purchase.set_course_enrollment
  end
end
