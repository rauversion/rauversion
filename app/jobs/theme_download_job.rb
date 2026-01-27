require 'open-uri'
require 'rubygems/package'
require 'zlib'

class ThemeDownloadJob < ApplicationJob
  queue_as :default

  def perform(theme_id, user_id)
    theme = Theme.find(theme_id)
    channel_name = "theme_download_#{theme_id}_#{user_id}"

    begin
      # Broadcast initial status
      broadcast_progress(channel_name, {
        status: 'started',
        message: 'Starting theme download...',
        progress: 0
      })

      # Download tarball from GitHub
      tarball_url = theme.github_tarball_url
      
      broadcast_progress(channel_name, {
        status: 'downloading',
        message: "Downloading from #{theme.repo}...",
        progress: 20
      })

      # Download the tarball
      tarball_data = URI.open(tarball_url, 
        'User-Agent' => 'Rauversion',
        read_timeout: 60
      ).read

      broadcast_progress(channel_name, {
        status: 'extracting',
        message: 'Extracting files...',
        progress: 50
      })

      # Extract files from tarball
      files = extract_tarball(tarball_data)

      broadcast_progress(channel_name, {
        status: 'processing',
        message: 'Processing files...',
        progress: 70
      })

      # Broadcast files to client
      broadcast_progress(channel_name, {
        status: 'completed',
        message: 'Theme downloaded successfully!',
        progress: 100,
        files: files
      })

    rescue StandardError => e
      Rails.logger.error("Theme download failed: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      
      broadcast_progress(channel_name, {
        status: 'error',
        message: "Failed to download theme: #{e.message}",
        progress: 0
      })
    end
  end

  private

  def broadcast_progress(channel_name, data)
    ActionCable.server.broadcast(channel_name, data)
  end

  def extract_tarball(tarball_data)
    files = []
    
    # Create a StringIO object from the tarball data
    io = StringIO.new(tarball_data)
    
    # Extract files from the gzipped tarball
    Zlib::GzipReader.wrap(io) do |gz|
      Gem::Package::TarReader.new(gz) do |tar|
        tar.each do |entry|
          next unless entry.file?
          
          # Remove the first directory component (GitHub adds a repo-ref/ prefix)
          path = entry.full_name.split('/', 2).last
          next if path.nil? || path.empty?
          
          files << {
            path: path,
            content: entry.read,
            size: entry.size
          }
        end
      end
    end
    
    files
  end
end
