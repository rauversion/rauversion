class PagesController < ApplicationController
  before_action :set_page, only: [:update, :destroy]
  before_action :require_admin!, only: [:create, :update, :destroy]

  # GET /pages
  def index
    @pages = Page.all
    respond_to do |format|
      format.json { render :index }
      format.html { render_blank }
    end
  end

  # GET /pages/:id
  def show
    @page = Page.friendly.find(params[:id])
    respond_to do |format|
      format.json { render :show }
      format.html { render_blank }
    end
  end


  # GET /pages/:id/edit
  def edit
    respond_to do |format|
      format.json { render :show }
      format.html { render_blank }
    end
  end

  # POST /pages
  def create
    @page = Page.new(page_params)
    respond_to do |format|
      if @page.save
        format.json { render :show, status: :created }
        format.html { render_blank }
      else
        format.json { render json: { errors: @page.errors.full_messages }, status: :unprocessable_entity }
        format.html { render_blank }
      end
    end
  end

  # PATCH/PUT /pages/:id
  def update
    respond_to do |format|
      if @page.update(page_params)
        format.json { render :show }
        format.html { render_blank }
      else
        format.json { render json: { errors: @page.errors.full_messages }, status: :unprocessable_entity }
        format.html { render_blank }
      end
    end
  end

  # DELETE /pages/:id
  def destroy
    @page.destroy
    respond_to do |format|
      format.json { head :no_content }
      format.html { render_blank }
    end
  end

  def menus
    @pages = Page.where(menu: params[:menu], published: true)
    respond_to do |format|
      format.json { render json: @pages.as_json(only: [:id, :title, :slug]) }
      format.html { render_blank }
    end
  end

  private

  def set_page
    @page = Page.friendly.find(params[:id])
  end

  def page_params
    params.require(:page).permit(:title, :slug, :published, :menu, :settings, body: {})
  end

  def require_admin!
    unless current_user&.is_admin?
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
