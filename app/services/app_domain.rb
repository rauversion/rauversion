class AppDomain
  class << self
    def base_url
      uri.to_s.delete_suffix("/")
    end

    def host
      uri.host
    end

    def tenant_url(tenant)
      destination = uri
      destination.host = "#{tenant.slug}.#{destination.host}" unless tenant.central?
      destination.to_s.delete_suffix("/")
    end

    private

    def uri
      domain = ENV["APP_DOMAIN"].presence || PublicUrlOptions.base_url
      protocol = Rails.application.config.force_ssl ? "https" : "http"
      domain = "#{protocol}://#{domain}" unless domain.match?(%r{\Ahttps?://}i)
      URI.parse(domain)
    end
  end
end
