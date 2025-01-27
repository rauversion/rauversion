class AlbumsController < ApplicationController

  before_action :disable_footer, only: :show

  def show
    @release = Release.friendly.find(params[:id])
  end

  def index
  end
end
