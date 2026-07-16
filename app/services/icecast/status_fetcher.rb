require "ipaddr"
require "json"
require "net/http"
require "openssl"
require "resolv"
require "uri"

module Icecast
  class StatusFetcher
    class Error < StandardError; end
    class InvalidUrl < Error; end
    class Unavailable < Error; end
    class InvalidResponse < Error; end

    MAX_RESPONSE_BYTES = 256.kilobytes
    OPEN_TIMEOUT = 2
    READ_TIMEOUT = 3

    BLOCKED_NETWORKS = %w[
      0.0.0.0/8
      10.0.0.0/8
      100.64.0.0/10
      127.0.0.0/8
      169.254.0.0/16
      172.16.0.0/12
      192.0.0.0/24
      192.0.2.0/24
      192.168.0.0/16
      198.18.0.0/15
      198.51.100.0/24
      203.0.113.0/24
      224.0.0.0/4
      240.0.0.0/4
      ::/128
      ::1/128
      fc00::/7
      fe80::/10
      ff00::/8
      2001:db8::/32
    ].map { |network| IPAddr.new(network) }.freeze

    def initialize(stream_url)
      @stream_uri = parse_stream_uri(stream_url)
    end

    def call
      payload = JSON.parse(fetch_status_body)
      source = matching_source(payload.dig("icestats", "source"))

      return offline_status unless source

      {
        online: true,
        server_name: source["server_name"].presence,
        title: source["title"].presence,
        listeners: source["listeners"].to_i,
        listenurl: source["listenurl"].presence
      }
    rescue JSON::ParserError => error
      raise InvalidResponse, error.message
    end

    private

    def parse_stream_uri(stream_url)
      uri = URI.parse(stream_url.to_s)
      valid = uri.is_a?(URI::HTTP) && uri.host.present? && uri.userinfo.blank?
      raise InvalidUrl, "The stream URL must use HTTP or HTTPS" unless valid

      uri
    rescue URI::InvalidURIError => error
      raise InvalidUrl, error.message
    end

    def status_uri
      uri = @stream_uri.dup
      uri.path = "/status-json.xsl"
      uri.query = nil
      uri.fragment = nil
      uri
    end

    def fetch_status_body
      uri = status_uri
      resolved_ip = resolve_public_address(uri.host)
      http = Net::HTTP.new(uri.host, uri.port)
      http.ipaddr = resolved_ip if resolved_ip && http.respond_to?(:ipaddr=)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = OPEN_TIMEOUT
      http.read_timeout = READ_TIMEOUT

      request = Net::HTTP::Get.new(uri.request_uri)
      request["Accept"] = "application/json"
      request["User-Agent"] = "Rauversion-Icecast/1.0"

      response = http.start { |client| client.request(request) }
      raise Unavailable, "Icecast returned HTTP #{response.code}" unless response.code.to_i.between?(200, 299)
      raise InvalidResponse, "Icecast status response is too large" if response.body.to_s.bytesize > MAX_RESPONSE_BYTES

      response.body.to_s
    rescue Error
      raise
    rescue Timeout::Error, SocketError, SystemCallError, IOError, OpenSSL::SSL::SSLError => error
      raise Unavailable, error.message
    end

    def resolve_public_address(host)
      addresses = Resolv.getaddresses(host)
      raise Unavailable, "Icecast host could not be resolved" if addresses.empty?

      return addresses.first unless Rails.env.production?

      candidates = addresses.map { |value| IPAddr.new(value) }
      safe = candidates.all? do |candidate|
        BLOCKED_NETWORKS.none? { |network| network.include?(candidate) }
      end
      raise InvalidUrl, "Private Icecast hosts are not allowed" unless safe

      candidates.first.to_s
    rescue Resolv::ResolvError, IPAddr::InvalidAddressError => error
      raise Unavailable, error.message
    end

    def matching_source(raw_source)
      sources = Array.wrap(raw_source).compact
      return if sources.empty?

      sources.find { |source| source_mount_path(source) == @stream_uri.path } || sources.first
    end

    def source_mount_path(source)
      URI.parse(source["listenurl"].to_s).path
    rescue URI::InvalidURIError
      nil
    end

    def offline_status
      {
        online: false,
        server_name: nil,
        title: nil,
        listeners: 0,
        listenurl: nil
      }
    end
  end
end
