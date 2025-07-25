class PagesController < ApplicationController
  before_action :set_page, only: [:show, :update, :destroy]
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

  private

  def set_page
    @page = Page.find(params[:id])
  end

  def page_params
    params.require(:page).permit(:title, :slug, :published, :menu, :body, :settings)
  end

  def require_admin!
    unless current_user&.is_admin?
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end
end
