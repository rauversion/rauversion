require "json"
require "open3"
require "uri"

class MjmlCompiler
  class CompilationError < StandardError; end

  SCRIPT_PATH = Rails.root.join("script", "mjml_compile.mjs").freeze

  class << self
    def compile(mjml)
      stdout, stderr, status = Open3.capture3(
        "node",
        SCRIPT_PATH.to_s,
        stdin_data: mjml.to_s
      )

      raise CompilationError, stderr.presence || "MJML compilation failed" unless status.success?

      result = JSON.parse(stdout)
      result["html"] = absolutize_active_storage_image_urls(result["html"])
      result
    rescue Errno::ENOENT
      raise CompilationError, "Node.js is not available in the current environment"
    rescue JSON::ParserError
      raise CompilationError, "MJML compiler returned an invalid response"
    end

    private

    def absolutize_active_storage_image_urls(html)
      return html.to_s if html.blank?

      base_url = public_base_url
      return html.to_s if base_url.blank?

      html.to_s.gsub(/(<img\b[^>]*\bsrc=["'])(\/rails\/active_storage\/[^"']+)(["'][^>]*>)/i) do
        %(#{$1}#{URI.join(base_url, $2).to_s}#{$3})
      end
    end

    def public_base_url
      mailer_options = Rails.application.config.action_mailer.default_url_options || {}
      route_options = Rails.application.routes.default_url_options || {}

      raw_host = mailer_options[:host].presence || route_options[:host].presence
      return if raw_host.blank?

      host = raw_host.to_s
      return host.chomp("/") if host.match?(%r{\Ahttps?://}i)

      protocol =
        mailer_options[:protocol].presence ||
        route_options[:protocol].presence ||
        (Rails.application.config.force_ssl ? "https" : "http")

      port = mailer_options[:port].presence || route_options[:port].presence
      host_with_port =
        if port.present? && host.exclude?(":")
          "#{host}:#{port}"
        else
          host
        end

      "#{protocol}://#{host_with_port}".chomp("/")
    end
  end
end
