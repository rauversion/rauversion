module Newsletter
  class DashboardController < ApplicationController
    before_action :authenticate_user!

    def index
      render_blank
    end
  end
end
