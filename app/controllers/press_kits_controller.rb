class PressKitsController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :find_user
  before_action :find_or_initialize_press_kit, only: [:show, :edit, :update]
  before_action :authorize_user!, only: [:edit, :update]

  def show
    if @press_kit.new_record? || (!@press_kit.published? && !authorized_to_edit?)
      respond_to do |format|
        format.html do
          flash[:notice] = I18n.t("press_kits.not_found")
          render inline: "", layout: "react"
        end
        format.json { render json: { error: I18n.t("press_kits.not_found") }, status: :not_found }
      end
      return
    end

    respond_to do |format|
      format.html
      format.json
    end
  end

  def edit
    respond_to do |format|
      format.html
      format.json
    end
  end

  def update
    if @press_kit.update(press_kit_params)
      respond_to do |format|
        format.html { redirect_to user_press_kit_path(@user), notice: 'Press kit was successfully updated.' }
        format.json { render :show, status: :ok }
      end
    else
      respond_to do |format|
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @press_kit.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def find_user
    @user = User.find_by(username: params[:username])
    unless @user
      respond_to do |format|
        format.html do
          flash[:notice] = I18n.t("users.not_found")
          render inline: "", layout: "react"
        end
        format.json { render json: { error: I18n.t("users.not_found") }, status: :not_found }
      end
    end
  end

  def find_or_initialize_press_kit
    @press_kit = @user.press_kit || @user.build_press_kit
  end

  def authorize_user!
    unless authorized_to_edit?
      respond_to do |format|
        format.html { redirect_to user_press_kit_path(@user), alert: 'Not authorized.' }
        format.json { render json: { error: 'Not authorized' }, status: :forbidden }
      end
    end
  end

  def authorized_to_edit?
    current_user && (current_user == @user || current_user.is_admin?)
  end

  def press_kit_params
    params.require(:press_kit).permit(
      :bio,
      :press_release,
      :technical_rider,
      :stage_plot,
      :booking_info,
      :published,
      settings: { video_urls: [], featured_track_ids: [], featured_playlist_ids: [] },
      photos: [],
      documents: []
    )
  end
end
