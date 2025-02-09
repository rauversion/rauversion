class PlayerController < ApplicationController
  def update
    @tracks = Track.where(id: params[:player][:ids])
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
  end

  def show
    id = params[:id]
    @track = Track.friendly.find(id)

    render status: :ok and return if @track.blank? 

    respond_to do |format|
      format.json
      format.html do
        if params[:t]
          render turbo_stream: [
            turbo_stream.update(
              "player-frame",
              partial: "player",
              locals: {track: @track}
            )
          ]
        end
      end
    end
  end

  def tracklist
    if params[:ids].present?
      # Find tracks by IDs and maintain the order they were sent in
      track_ids = params[:ids]
      @tracks = Track.where(id: track_ids)
                    .with_attached_cover
                    .includes(user: {avatar_attachment: :blob})
      
      # Order tracks based on the original IDs array order
      @tracks = @tracks.index_by(&:id).values_at(*track_ids.map(&:to_i)).compact
    else
      @tracks = []
    end
    
    respond_to do |format|
      format.json
    end
  end

  def next_track(id)
    Track.where("id > ?", id).order(id: :asc).first
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
  end

  def previous(id)
    Track.where("id < ?", id).order(id: :desc).first
      .with_attached_cover
      .includes(user: {avatar_attachment: :blob})
  end
end
