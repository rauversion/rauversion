class RepostsController < ApplicationController
  before_action :authenticate_user!

  def create
    @track = Track.for_tenant.friendly.find(params[:track_id])
    if reposts = current_user.reposts.where(track: @track) and reposts.any?
      reposts.delete_all
      @button_class = "button"
    else
      @button_class = "button-active"
      @repost = current_user.reposts.create(track: @track)
      if @repost.errors.blank?
        flash.now[:notice] = "Reposted ok!"
      end
    end
  end
end
