require "base64"
require "nokogiri"

module Newsletter
  class BroadcastTracking
    class InvalidToken < StandardError; end

    TRANSPARENT_GIF = Base64.decode64("R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==").b.freeze
    SKIPPED_HREF_PREFIXES = %w[# mailto: tel: javascript: data:].freeze

    class << self
      def prepare_html(recipient:, html:)
        return html.to_s if html.blank?

        document = Nokogiri::HTML(html.to_s)
        rewrite_links!(document, recipient)
        inject_open_pixel!(document, recipient)
        document.to_html
      end

      def transparent_pixel
        TRANSPARENT_GIF
      end

      def record_open!(token:, request:)
        recipient = recipient_from_token(token, expected_event_type: "open")
        create_event!(recipient: recipient, event_type: "open", request: request)
        recipient
      end

      def record_click!(token:, request:)
        payload = verified_payload(token)
        raise InvalidToken unless payload["event_type"] == "click"

        recipient = find_recipient(payload["recipient_id"])
        tracked_url = payload["url"].to_s
        raise InvalidToken if tracked_url.blank?

        create_event!(
          recipient: recipient,
          event_type: "click",
          tracked_url: tracked_url,
          request: request
        )

        tracked_url
      end

      def open_url_for(recipient)
        Rails.application.routes.url_helpers.newsletter_track_open_url(
          { token: open_token_for(recipient) }.merge(PublicUrlOptions.to_h)
        )
      end

      def click_url_for(recipient:, url:)
        Rails.application.routes.url_helpers.newsletter_track_click_url(
          { token: click_token_for(recipient: recipient, url: url) }.merge(PublicUrlOptions.to_h)
        )
      end

      private

      def rewrite_links!(document, recipient)
        document.css("a[href]").each do |link|
          href = link["href"].to_s.strip
          next unless trackable_href?(href)

          link["href"] = click_url_for(recipient: recipient, url: href)
        end
      end

      def inject_open_pixel!(document, recipient)
        node = Nokogiri::XML::Node.new("img", document)
        node["src"] = open_url_for(recipient)
        node["alt"] = ""
        node["width"] = "1"
        node["height"] = "1"
        node["aria-hidden"] = "true"
        node["style"] = "display:block !important;border:0;height:1px;width:1px;max-height:1px;max-width:1px;opacity:0;overflow:hidden;"

        container = document.at_css("body") || document.at_css("html") || document.root
        container.add_child(node) if container
      end

      def trackable_href?(href)
        return false if href.blank?
        return false if SKIPPED_HREF_PREFIXES.any? { |prefix| href.downcase.start_with?(prefix) }

        true
      end

      def open_token_for(recipient)
        verifier.generate({
          recipient_id: recipient.id,
          event_type: "open",
        })
      end

      def click_token_for(recipient:, url:)
        verifier.generate({
          recipient_id: recipient.id,
          event_type: "click",
          url: url.to_s,
        })
      end

      def recipient_from_token(token, expected_event_type:)
        payload = verified_payload(token)
        raise InvalidToken unless payload["event_type"] == expected_event_type

        find_recipient(payload["recipient_id"])
      end

      def verified_payload(token)
        payload = verifier.verified(token.to_s)
        raise InvalidToken unless payload.is_a?(Hash)

        payload.stringify_keys
      end

      def find_recipient(recipient_id)
        Newsletter::BroadcastRecipient.includes(:broadcast).find(recipient_id)
      rescue ActiveRecord::RecordNotFound
        raise InvalidToken
      end

      def create_event!(recipient:, event_type:, request:, tracked_url: nil)
        Newsletter::BroadcastEvent.create!(
          broadcast: recipient.broadcast,
          recipient: recipient,
          event_type: event_type,
          tracked_url: tracked_url,
          ip_address: request.remote_ip,
          user_agent: request.user_agent.to_s,
          occurred_at: Time.current
        )
      end

      def verifier
        @verifier ||= ActiveSupport::MessageVerifier.new(
          Rails.application.secret_key_base,
          digest: "SHA256",
          serializer: JSON
        )
      end
    end
  end
end
