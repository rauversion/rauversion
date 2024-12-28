class PodcasterHostsController < ApplicationController
  before_action :authenticate_user!

  def new
    @podcaster_host = current_user.podcaster_info.podcaster_hosts.new
  end

  def create
    user = User.find_by(email: params[:podcaster_host][:email])
    
    @podcaster_info = current_user.podcaster_info

    if user && @podcaster_info.podcaster_hosts.where(user_id: user.id).blank?
      @podcaster_host = @podcaster_info.podcaster_hosts.build(user_id: user.id)
      
      if @podcaster_host.save
        flash.now[:success] = "Host added successfully"
        render :create
      else
        render :new, status: :unprocessable_entity
      end
    else
      @podcaster_host = PodcasterHost.new
      flash.now[:error] = "User not found with that email"
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    @podcaster_host = current_user.podcaster_info.podcaster_hosts.find(params[:id])
    @podcaster_host.destroy
    # redirect_to user_podcaster_hosts_path(current_user.username), notice: "Host removed successfully"
  end
end
