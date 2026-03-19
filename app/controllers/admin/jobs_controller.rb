module Admin
  class JobsController < ApplicationController
    before_action :ensure_admin!

    private

    def ensure_admin!
      redirect_to(root_path) unless current_user&.admin?
    end
  end
end
