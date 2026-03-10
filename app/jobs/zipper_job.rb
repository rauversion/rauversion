require "zip"

class ZipperJob < ApplicationJob
  queue_as :default

  def perform(track_id: nil, playlist_id: nil, purchase_id: nil)
    if purchase_id
      purchase = Purchase.find(purchase_id)
      resource = purchase.purchasable
      if resource.is_a?(Track) 
        track_zip(resource)
      elsif resource.is_a?(Playlist)
        playlist_zip(resource)
      end
      
      resource.reload
      Rails.logger.info "ZipperJob completed for purchase #{purchase.id}."
      # Notify the user via ActionCable that the zip is ready
      if resource.zip.attached? && purchase.user
        ActionCable.server.broadcast(
          "purchase_channel_#{purchase.user.id}",
          {
            action: 'download_ready',
            purchase_id: purchase.id,
            download_url: Rails.application.routes.url_helpers.rails_blob_url(resource.zip)
          }
        )
      end
    elsif track_id
      track = Track.find_by(id: track_id)
      return unless track
      track_zip(track)
    elsif playlist_id
      playlist = Playlist.find_by(id: playlist_id)
      return unless playlist
      playlist_zip(playlist)
    else
      Rails.logger.warn "ZipperJob called without track_id or playlist_id."
    end
  rescue => e
    Rails.logger.error "Failed to zip: #{e.message}"
  end

  private

  def track_zip(record)
    attachment = downloadable_attachment_for(record)
    unless attachment&.attached?
      Rails.logger.warn "Track #{record.id} has no downloadable media."
      return
    end

    media_path = Rails.root.join("tmp", attachment.filename.to_s)
    attachment.download do |chunk|
      File.open(media_path, "ab") do |file|
        file.write(chunk)
      end
    end

    zipfile_path = Rails.root.join("tmp", "#{attachment.filename.base}.zip")
    Zip::File.open(zipfile_path, Zip::File::CREATE) do |zipfile|
      zipfile.add(attachment.filename.to_s, media_path)
    end

    record.zip.attach(io: File.open(zipfile_path), filename: "#{attachment.filename.base}.zip", content_type: "application/zip")

    File.delete(media_path)
    File.delete(zipfile_path)
  rescue => e
    Rails.logger.error "Error zipping track #{record.id}: #{e.message}"
  end


  def playlist_zip(playlist)
    zip_file = Tempfile.new(["#{playlist.slug}-#{playlist.id}", '.zip'])
  
    begin
      Zip::File.open(zip_file.path, Zip::File::CREATE) do |zipfile|
        playlist.tracks.each do |track|
          attachment = downloadable_attachment_for(track)
          next unless attachment&.attached?
  
          begin
            attachment.open do |file|
              filename = attachment.filename.to_s
              zipfile.get_output_stream(filename) do |os|
                IO.copy_stream(file, os)
              end
            end
          rescue StandardError => e
            Rails.logger.error("Error processing track #{track.id}: #{e.message}")
          end
        end
      end
  
      # Attach the zipped file to the playlist
      playlist.zip.attach(
        io: File.open(zip_file.path),
        filename: "#{playlist.slug}.zip",
        content_type: 'application/zip'
      )
  
      # # Broadcast the update (commented out as requested)
      # Turbo::StreamsChannel.broadcast_replace_to(
      #   "playlist_#{playlist.id}",
      #   target: "playlist_#{playlist.id}_download",
      #   partial: 'playlists/download_ready',
      #   locals: { playlist: playlist }
      # )
  
      true # Return true if successful
    rescue StandardError => e
      Rails.logger.error("Failed to create zip for playlist #{playlist.id}: #{e.message}")
      
      # # Broadcast error message (commented out as requested)
      # Turbo::StreamsChannel.broadcast_replace_to(
      #   "playlist_#{playlist.id}",
      #   target: "playlist_#{playlist.id}_download",
      #   partial: 'playlists/download_error',
      #   locals: { playlist: playlist, error: e.message }
      # )
  
      false # Return false if failed
    ensure
      zip_file.close
      zip_file.unlink
    end
  end

  def downloadable_attachment_for(record)
    return record.downloadable_media if record.respond_to?(:downloadable_media)

    return record.audio if record.respond_to?(:audio) && record.audio.attached?
    return record.video if record.respond_to?(:video) && record.video.attached?
    return record.mp3_audio if record.respond_to?(:mp3_audio) && record.mp3_audio.attached?
  end

end
