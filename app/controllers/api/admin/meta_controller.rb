module Api
  module Admin
    class MetaController < BaseController
      def show
        render json: {
          navigation: ::Admin::ResourceRegistry.nav_items
        }
      end
    end
  end
end
