class UserLinksController < ApplicationController
  before_action :authenticate_user!, except: [:index]
  before_action :set_user_link, only: [:edit, :update, :destroy]
  
  def index
    @user = User.find_by!(username: params[:user_id])
    @user_links = @user.user_links.page(params[:page]).per(10)

    respond_to do |format|
      format.html do
        set_meta_tags title: @user.social_title.presence || "#{@user.username}'s Links",
                    site: 'Rauversion',
                    reverse: true,
                    description: @user.social_description,
                    keywords: ['social links', 'profile', @user.username],
                    og: {
                      title: @user.social_title.presence || "#{@user.username}'s Links",
                      description: @user.social_description,
                      type: 'profile',
                      url: user_user_links_url(@user.username),
                      image: @user.avatar_url(:medium)
                    },
                    twitter: {
                      card: 'summary',
                      site: '@rauversion',
                      title: @user.social_title.presence || "#{@user.username}'s Links",
                      description: @user.social_description,
                      image: @user.avatar_url(:medium)
                    }
      end
      format.json
    end
  end

  def new
    @user = current_user
    @user_link = UserLinks::WebsiteLink.new(user_id: current_user.id)
  end

  def create
    @user_link = current_user.user_links.new(user_link_params)
    @user_link.type = "UserLinks::WebsiteLink"
    
    respond_to do |format|
      if @user_link.save
        format.html { redirect_to user_user_links_path(user_id: current_user.username), notice: 'Link was successfully created.' }
        format.json { render :create }
      else
        format.html { render :new }
        format.json { render json: { error: @user_link.errors.full_messages.to_sentence }, status: :unprocessable_entity }
      end
    end
  end

  def edit
  end

  def update
    respond_to do |format|
      if @user_link.update(user_link_params)
        format.html { redirect_to user_user_links_path(user_id: current_user.username), notice: 'Link was successfully updated.' }
        format.json { render :update }
      else
        format.html { render :edit }
        format.json { render json: { error: @user_link.errors.full_messages.to_sentence }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @user_link.destroy
    respond_to do |format|
      format.html { redirect_to user_user_links_path(user_id: current_user.username), notice: 'Link was successfully deleted.' }
      format.json { render json: { message: 'Link was successfully deleted.' } }
    end
  end

  private

  def set_user_link
    @user_link = current_user.user_links.find(params[:id])
  end

  def user_link_params
    params.require(:user_links_website_link).permit(
      :title, 
      :type,
      :username,
      :title, 
      :id,
      :url,
      :position,
      :custom_url)
  end
end
