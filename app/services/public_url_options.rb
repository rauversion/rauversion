require "uri"

class PublicUrlOptions
  class << self
    def to_h
      mailer_options = normalize_options(Rails.application.config.action_mailer.default_url_options)
      route_options = normalize_options(Rails.application.routes.default_url_options)

      explicit_protocol = mailer_options[:protocol].presence || route_options[:protocol].presence
      raw_host = mailer_options[:host].presence || route_options[:host].presence
      return {} if raw_host.blank?

      parsed_uri = parse_uri(raw_host, explicit_protocol || default_protocol)
      protocol = explicit_protocol || parsed_uri&.scheme || default_protocol
      host = parsed_uri&.host.presence || raw_host.to_s
      port = mailer_options[:port].presence || route_options[:port].presence || inferred_port(parsed_uri, protocol)

      compact_options(
        host: host,
        protocol: protocol,
        port: port
      )
    end

    def base_url
      options = to_h
      return if options[:host].blank?

      url = +"#{options[:protocol] || default_protocol}://#{options[:host]}"
      url << ":#{options[:port]}" if options[:port].present?
      url
    end

    private

    def normalize_options(value)
      case value
      when Hash
        value.symbolize_keys
      else
        {}
      end
    end

    def parse_uri(host, protocol)
      candidate = host.to_s
      candidate = "#{protocol}://#{candidate}" unless candidate.match?(%r{\Ahttps?://}i)
      URI.parse(candidate)
    rescue URI::InvalidURIError
      nil
    end

    def default_protocol
      Rails.application.config.force_ssl ? "https" : "http"
    end

    def inferred_port(uri, protocol)
      return if uri.blank? || uri.port.blank?
      return if uri.port == default_port(protocol)

      uri.port
    end

    def default_port(protocol)
      protocol.to_s == "https" ? 443 : 80
    end

    def compact_options(options)
      options.each_with_object({}) do |(key, value), memo|
        memo[key] = value if value.present?
      end
    end
  end
end
