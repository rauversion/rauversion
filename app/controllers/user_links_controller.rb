class UserLinksController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user_link, only: [:edit, :update, :destroy]
  
  def index
    @user = User.find_by!(username: params[:user_id])
    @user_links = @user.user_links
  end

  def new
    @user_link = UserLinks::WebsiteLink.new(user_id: current_user.id)
  end

  def create
    @user_link = current_user.user_links.new(user_link_params)
    @user_link.type = "UserLinks::WebsiteLink"
    if @user_link.save
      redirect_to user_user_links_path(user_id: current_user.username), notice: 'Link was successfully created.'
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @user_link.update(user_link_params)
      redirect_to user_user_links_path(user_id: current_user.username), notice: 'Link was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    @user_link.destroy
    redirect_to user_user_links_path(user_id: current_user.username), notice: 'Link was successfully deleted.'
  end

  private

  def set_user_link
    @user_link = current_user.user_links.find(params[:id])
  end

  def user_link_params
    params.require(:user_links_website_link).permit(
      :title, 
      :url,
      :position,
      :custom_url)
  end
end
