module PlayerHelper
  def current_track_id
    params[:id]
  end

  def is_playing
    params[:t].present?
  end

  def render_play_button(track, options = {})
    render partial: "shared/play_button", 
           locals: { 
             track: track, 
             current_track_id: current_track_id,
             is_playing: is_playing
           }.merge(options)
  end
end
