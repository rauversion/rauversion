module Store
  class ServicesController < ApplicationController
    def index
      @q = Products::ServiceProduct.active.includes(:user, :product_images).ransack(params[:q])
      @products = @q.result(distinct: true).order(created_at: :desc)
      
      @products = @products.where(service_type: params[:service_type]) if params[:service_type].present?
      @products = @products.where(delivery_method: params[:delivery]) if params[:delivery].present?
      
      @products = @products.page(params[:page]).per(20)
    end
  end
end
