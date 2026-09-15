class SharerController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def new
    @resource, @resource_path = find_resource

    @button_class = "button"

    @share_url = private_track_url(@resource.signed_id, utm_source: "clipboard", utm_campaign: "social_sharing", utm_medium: "text")
    # @share_url = #if @resource.private?
    #  private_track_url(@resource.signed_id, utm_source: 'clipboard', utm_campaign: 'social_sharing', utm_medium: 'text')
    # else
    #  track_url(@resource, utm_source: 'clipboard', utm_campaign: 'social_sharing', utm_medium: 'text')
    # end
  end

  def find_resource
    if params[:track_id]
      resource = Track.for_tenant.friendly.find(params[:track_id])
      [resource, track_embed_url(resource)]
    elsif params[:playlist_id]
      resource = Playlist.for_tenant.friendly.find(params[:playlist_id])
      [resource, playlist_embed_url(resource)]
    end
  end
end
