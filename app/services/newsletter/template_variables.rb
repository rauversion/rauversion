require "cgi"

module Newsletter
  class TemplateVariables
    VARIABLE_ALIASES = {
      "name" => "name",
      "recipient_name" => "name",
      "full_name" => "name",
      "first_name" => "first_name",
      "recipient_first_name" => "first_name",
      "last_name" => "last_name",
      "recipient_last_name" => "last_name",
      "email" => "email",
      "recipient_email" => "email",
      "country" => "country",
      "recipient_country" => "country",
      "sender_name" => "sender_name",
      "sender_display_name" => "sender_name",
      "account_name" => "sender_name",
      "sender_first_name" => "sender_first_name",
      "sender_last_name" => "sender_last_name",
      "sender_username" => "sender_username",
      "sender_email" => "sender_email",
      "app_name" => "app_name",
    }.freeze

    DEFAULT_APP_NAME = "Rauversion".freeze

    def self.build_map(sender:, recipient:, app_name: DEFAULT_APP_NAME)
      recipient_email = recipient.email.to_s
      derived = derive_recipient_from_email(recipient_email)
      recipient_name =
        recipient.respond_to?(:resolved_name) && recipient.resolved_name.present? ? recipient.resolved_name :
        recipient.try(:name).presence ||
          recipient.try(:display_name).presence ||
          [recipient.try(:first_name), recipient.try(:last_name)].compact.join(" ").strip.presence ||
          derived[:name]

      sender_name =
        sender.try(:display_name).presence ||
        sender.try(:full_name).presence ||
        sender.try(:username).presence ||
        DEFAULT_APP_NAME

      {
        "name" => recipient_name.to_s,
        "first_name" => recipient.try(:first_name).presence.to_s.presence || derived[:first_name],
        "last_name" => recipient.try(:last_name).presence.to_s.presence || derived[:last_name],
        "email" => recipient_email.presence || derived[:email],
        "country" => recipient.try(:country).to_s,
        "sender_name" => sender_name.to_s,
        "sender_first_name" => sender.try(:first_name).to_s,
        "sender_last_name" => sender.try(:last_name).to_s,
        "sender_username" => sender.try(:username).to_s,
        "sender_email" => sender.try(:email).to_s,
        "app_name" => app_name.presence || DEFAULT_APP_NAME,
      }
    end

    def self.resolve(value, variables, escape_html_values: false)
      return value.to_s if value.blank?

      value.to_s.gsub(/{{\s*([\w.]+)\s*}}/) do |match|
        normalized_key = VARIABLE_ALIASES[Regexp.last_match(1)]
        next match if normalized_key.blank?

        resolved = variables[normalized_key].to_s
        escape_html_values ? CGI.escapeHTML(resolved) : resolved
      end
    end

    def self.derive_recipient_from_email(email)
      local_part = email.to_s.split("@").first.to_s
      parts = local_part.split(/[._-]+/).map(&:strip).reject(&:blank?)
      first_name = titleize_part(parts.first.presence || "Invitado")
      last_name = parts.size > 1 ? parts.drop(1).map { |part| titleize_part(part) }.join(" ") : ""
      full_name = [first_name, last_name].reject(&:blank?).join(" ").strip

      {
        name: full_name.presence || "Invitado",
        first_name: first_name,
        last_name: last_name,
        email: email.to_s,
      }
    end

    def self.titleize_part(value)
      return "" if value.blank?

      value[0].upcase + value[1..].to_s.downcase
    end
  end
end
