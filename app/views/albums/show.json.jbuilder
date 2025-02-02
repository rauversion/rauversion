# Basic release attributes
json.extract! @release,
  :id,
  :title,
  :subtitle,
  :template,
  :created_at,
  :updated_at,
  :editor_data

# Config attributes
json.config do
  json.cover_color @release.cover_color
  json.record_color @release.record_color
  json.sleeve_color @release.sleeve_color
  json.spotify @release.spotify
  json.bandcamp @release.bandcamp
  json.soundcloud @release.soundcloud
end

# Attached files
json.cover_url @release.cover.attached? ? url_for(@release.cover) : nil
json.sleeve_url @release.sleeve.attached? ? url_for(@release.sleeve) : nil

=begin
# Main playlist (owner)
json.playlist do
  json.extract! @release.playlist, :id, :title, :description
  json.cover_url @release.playlist.cover.attached? ? url_for(@release.playlist.cover) : nil
  json.user do
    json.extract! @release.playlist.user, :id, :username, :full_name, :avatar_url
  end
end

# Associated product if exists
if @release.product.present?
  json.product do
    json.extract! @release.product, :id, :title, :description, :price
  end
end



# Release playlists (other albums in the release)
json.release_playlists @release.release_playlists.includes(:playlist).order(:position) do |release_playlist|
  json.extract! release_playlist, :id, :position
  json.playlist do
    playlist = release_playlist.playlist
    json.extract! playlist, :id, :title, :description
    json.cover_url playlist.cover.attached? ? url_for(playlist.cover) : nil
    json.tracks_count playlist.tracks.size
    
    # Include basic track information
    json.tracks playlist.track_playlists.includes(:track).order(:position) do |track_playlist|
      track = track_playlist.track
      json.extract! track, :id, :title, :description, :duration
      begin
        json.audio_url url_for(track.mp3_audio) if track.audio.attached?
      rescue
      end
      json.cover_url url_for(track.cover) if track.cover.attached?
      json.position track_playlist.position
    end
  end
end

# Release sections with their images
json.release_sections @release.release_sections.includes(:release_section_images).order(:position) do |section|
  json.extract! section, :id, :title, :body, :position
  json.data do
    json.subtitle section.subtitle
    json.tag section.tag
    json.template section.template
  end
  
  json.images section.release_section_images do |image|
    json.extract! image, :id, :caption, :order
    begin
    json.url url_for(image.image) if image.image.attached?
    rescue
    end
  end
end
=end
