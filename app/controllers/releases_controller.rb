class ReleasesController < ApplicationController
  before_action :authenticate_user!, except: [:show, :preview]
  # before_action :find_playlist, except: [:puck, :upload_puck_image, :edit]
  before_action :disable_footer, only: [:editor]

  def index
    @releases = current_user.releases.page(params[:page]).per(10)
    respond_to do |format|
      format.html
      format.json
    end
  end

  def editor
    @release = current_user.releases.friendly.find(params[:id])
    @disable_player = true
    respond_to do |format|
      format.html { render "puck" }
      format.json
    end
  end

  def new
    @release = current_user.releases.new
  end

  def create
    @release = current_user.releases.new
    @release.template = "puck"
    permitted_params = release_params
    
    respond_to do |format|
      if @release.update(permitted_params)
        format.html { redirect_to edit_release_path(@release), notice: "success" }
        format.json { render :show, status: :created }
      else
        format.html { render "new", status: :unprocessable_entity }
        format.json { render json: @release.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    @release = current_user.releases.friendly.find(params[:id])
  end

  def show
    @release = Release.friendly.find(params[:id])
    respond_to do |format|
      format.html
      format.json
    end
  end

  def preview
    @release = Release.friendly.find(params[:id])
    respond_to do |format|
      format.html
      format.json
    end
  end

  def update
    @release = current_user.releases.friendly.find(params[:id])
    permitted_params = release_params

    if permitted_params[:playlist_ids].present?
      @release.release_playlists.destroy_all
      permitted_params[:playlist_ids].each do |playlist_id|
        @release.release_playlists.create(playlist_id: playlist_id)
      end
      render :show, format: :json and return
    end

    if params[:release][:theme_schema].present?
      if @release.update(theme_schema: params[:release][:theme_schema])
        render json: { status: 'success', message: 'Release updated successfully' }
      else
        render json: { status: 'error', message: @release.errors.full_messages }, status: :unprocessable_entity
      end
      return
    end

    if permitted_params[:editor_data].present?
      if @release.update(editor_data: permitted_params[:editor_data])
        render json: { status: 'success', message: 'Release updated successfully' }
      else
        render json: { status: 'error', message: @release.errors.full_messages }, status: :unprocessable_entity
      end
      return
    end

    respond_to do |format|
      if @release.update(permitted_params)
        format.html { 
          flash.now[:notice] = "updated"
          redirect_to edit_release_path(@release)
        }
        format.json { render :show }
        format.turbo_stream
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @release.errors, status: :unprocessable_entity }
        format.turbo_stream { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @release = current_user.releases.friendly.find(params[:id])
    @release.destroy
    
    respond_to do |format|
      format.html { redirect_to releases_path }
      format.json { head :no_content }
    end
  end

  def upload_puck_image
    uploaded_file = params[:file]
    blob = ActiveStorage::Blob.create_and_upload!(
      io: uploaded_file,
      filename: uploaded_file.original_filename,
      content_type: uploaded_file.content_type
    )
    
    variant = blob.variant(resize_to_fill: [1200, 1200]).processed
    
    render json: { 
      url: rails_blob_url(variant),
      id: blob.id
    }
  end

  private

  def release_params
    params.require(:release).permit(
      :subtitle, :cover, :cover_color, :record_color, :sleeve_color, 
      :spotify, :bandcamp, :soundcloud, 
      :product_id, :template, 
      :title, :description, :release_date, :private,
      :price, :currency, :minimum_price, :show_credits,
      :show_more_button, :credits, :about, :purchase_message,
      :purchase_description, :upsell_enabled, :upsell_message,
      :playlist_id,
      playlist_ids: [],
      release_playlists_attributes: [],
      release_sections_attributes: [],
      editor_data: {},
      theme_schema: {}
    )
  end

end
