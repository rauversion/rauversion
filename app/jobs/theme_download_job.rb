require 'net/http'
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

      # Download the tarball using Net::HTTP for better security
      tarball_data = download_tarball_securely(tarball_url)

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

  def download_tarball_securely(url)
    # Parse and validate the URL
    uri = URI.parse(url)
    
    # Ensure we're only downloading from GitHub API
    unless uri.host == 'api.github.com' && uri.scheme == 'https'
      raise SecurityError, 'Invalid download URL - only GitHub API is allowed'
    end

    # Use Net::HTTP for secure download
    Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 60) do |http|
      request = Net::HTTP::Get.new(uri.request_uri)
      request['User-Agent'] = 'Rauversion'
      
      response = http.request(request)
      
      case response
      when Net::HTTPSuccess
        response.body
      when Net::HTTPRedirection
        # GitHub API returns redirects to the actual tarball location
        redirect_uri = URI.parse(response['location'])
        download_from_redirect(redirect_uri)
      else
        raise "Failed to download tarball: #{response.code} #{response.message}"
      end
    end
  end

  def download_from_redirect(uri)
    # Follow redirect to download actual tarball
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', read_timeout: 60) do |http|
      request = Net::HTTP::Get.new(uri.request_uri)
      request['User-Agent'] = 'Rauversion'
      
      response = http.request(request)
      
      unless response.is_a?(Net::HTTPSuccess)
        raise "Failed to download tarball from redirect: #{response.code} #{response.message}"
      end
      
      response.body
    end
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
          parts = entry.full_name.split('/', 2)
          path = parts.length > 1 ? parts[1] : parts[0]
          
          # Skip if path is empty or just a dot
          next if path.nil? || path.empty? || path == '.'
          
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
