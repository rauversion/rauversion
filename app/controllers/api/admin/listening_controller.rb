module Api
  module Admin
    class ListeningController < BaseController
      def show
        scope = if platform_admin?
          ListeningEvent.all
        else
          ListeningEvent.where(track_id: Track.where(tenant_id: Current.tenant.id).select(:id))
            .or(ListeningEvent.where(playlist_id: Playlist.where(tenant_id: Current.tenant.id).select(:id)))
        end

        render json: ::Admin::ListeningDashboard.new(
          scope: scope,
          from: params[:from],
          to: params[:to]
        ).as_json
      end
    end
  end
end
