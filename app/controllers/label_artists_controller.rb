class LabelArtistsController < ApplicationController


  def index
    @label = User.where(role: ["artist", "admin"], label: true).find_by(username: params[:user_id])
    @artists = @label.child_accounts
    .with_attached_avatar
    .includes(:tracks, :playlists)
    .page(params[:page]).per(50)
  end
end
