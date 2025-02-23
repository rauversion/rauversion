class SpotlightsController < ApplicationController
  before_action :set_spotlight, only: [:destroy]
  def index
    user = User.find_by(username: params[:username])
    @spotlights = user.spotlights.order('position')
    @form = FormModels::SpotlightForm.new
    @form.items = @spotlights
    respond_to do |format|
      format.json
    end
  end

  def show
    user = User.find_by(username: params[:username])
    @spotlights = user.spotlights.order('position')
    @form = FormModels::SpotlightForm.new
    @form.items = @spotlights
    respond_to do |format|
      format.json { render :index }
    end
  end

  def edit
    @edit = true
    @edit = false if params[:cancel]
    @user = current_user
    @spotlights = current_user.spotlights.order('position')
    @form = FormModels::SpotlightForm.new
    @form.items = @spotlights 

    respond_to do |format|  
      format.html
      format.json { render :index }
    end
  end

  def create
    @edit = true
    @form = FormModels::SpotlightForm.new(items: [])

    
    if params[:state].present?
      resource = Track.find(params[:state])
      @form.items << Spotlight.new(spotlightable: resource)
    end

    if params.dig(:form_models_spotlight_form , :items_attributes).present?
      @form.assign_attributes(items_attributes: params[:form_models_spotlight_form][:items_attributes].permit!)
    end

    if true # params[:commit] == "Save"
      @form.items.each do |item|
        item.user_id = current_user.id
        item.save
      end

      respond_to do |format|
        format.json { render :show }
        format.html { render :edit }
      end
    else
      respond_to do |format|
        format.json { render :edit }
        format.html { render :edit }
      end
    end
  end

  def destroy
    @spotlight.destroy
    respond_to do |format|
      format.json { head :no_content }
      format.html { redirect_to edit_user_spotlights_path(current_user), notice: 'Spotlight was successfully removed.' }
    end
  end

  private

  def set_spotlight
    @spotlight = current_user.spotlights.find(params[:id])
  end
end
