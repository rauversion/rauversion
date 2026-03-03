require "net/http"
require "uri"

module Api
  class PuckController < ApplicationController
    skip_before_action :verify_authenticity_token, only: :chat
    before_action :authenticate_user!
    before_action :guard_artist

    def chat
      api_key = ENV["PUCK_API_KEY"]
      if api_key.blank?
        return render json: { error: "PUCK_API_KEY is not configured" }, status: :service_unavailable
      end

      uri = URI.parse("#{puck_cloud_host}/chat")
      payload = parsed_request_body

      upstream_request = Net::HTTP::Post.new(uri.request_uri)
      upstream_request["Content-Type"] = "application/json"
      upstream_request["x-api-key"] = api_key
      upstream_request.body = payload.to_json

      upstream_response = Net::HTTP.start(
        uri.host,
        uri.port,
        use_ssl: uri.scheme == "https",
        open_timeout: 10,
        read_timeout: 120
      ) do |http|
        http.request(upstream_request)
      end

      headers["Cache-Control"] = "no-cache"
      headers["x-vercel-ai-ui-message-stream"] = upstream_response["x-vercel-ai-ui-message-stream"] || "v1"

      render(
        body: upstream_response.body,
        status: upstream_response.code.to_i,
        content_type: upstream_response["content-type"] || "text/event-stream"
      )
    rescue JSON::ParserError
      render json: { error: "Invalid JSON payload" }, status: :bad_request
    rescue StandardError => e
      Rails.logger.error("Puck AI proxy failed: #{e.class} - #{e.message}")
      render json: { error: "Puck AI request failed" }, status: :bad_gateway
    end

    private

    def parsed_request_body
      body = request.raw_post.to_s
      return {} if body.blank?

      JSON.parse(body)
    end

    def puck_cloud_host
      ENV.fetch("PUCK_CLOUD_HOST", "https://cloud.puckeditor.com/api")
    end
  end
end
