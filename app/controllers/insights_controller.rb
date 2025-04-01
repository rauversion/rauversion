class InsightsController < ApplicationController
  def show
    @user = User.find_by!(username: params[:user_id])
    
    respond_to do |format|
      format.html
      format.json
    end
  end
end
