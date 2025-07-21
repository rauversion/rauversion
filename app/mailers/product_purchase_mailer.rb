class ProductPurchaseMailer < ApplicationMailer
  def purchase_confirmation(purchase)
    @purchase = purchase
    @user = purchase.user
    mail(to: @user.email, subject: 'Purchase Confirmation')
  end

  def sell_confirmation(purchase, seller)
    @purchase = purchase
    @seller = seller
    @seller_products = purchase.products.select { |product| product.user_id == seller.id }
    mail(to: @seller.email, subject: 'Product Sold Confirmation')
  end

  def status_update(purchase)
    @purchase = purchase
    @user = purchase.user
    mail(to: @user.email, subject: "Your order status has been updated")
  end
end
