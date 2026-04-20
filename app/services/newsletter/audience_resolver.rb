require "set"

module Newsletter
  class AudienceResolver
    def initialize(user:, sources:)
      @user = user
      @sources = Array(sources)
      @warnings = []
      @raw_recipients_count = 0
      @source_summaries = []
    end

    def resolve
      recipient_map = {}

      normalized_sources.each do |source|
        recipients, label = recipients_for_source(source)
        @raw_recipients_count += recipients.length
        @source_summaries << {
          key: source_key(source),
          source_type: source[:source_type],
          label: label,
          raw_count: recipients.length,
          unique_count: recipients.map { |recipient| recipient[:email] }.uniq.length,
        }

        recipients.each do |recipient|
          email = recipient[:email].to_s.downcase.strip
          next if email.blank?

          incoming = recipient.merge(email: email)
          existing = recipient_map[email]

          if existing.present?
            recipient_map[email] = merge_recipient(existing, incoming)
          else
            recipient_map[email] = incoming
          end
        end
      end

      recipients = recipient_map.values
        .sort_by { |recipient| [recipient[:name].to_s.downcase, recipient[:email]] }
        .map { |recipient| serialize_recipient(recipient) }

      {
        recipients: recipients,
        raw_recipients_count: @raw_recipients_count,
        unique_recipients_count: recipients.length,
        deduplicated_count: @raw_recipients_count - recipients.length,
        source_summaries: @source_summaries,
        warnings: @warnings,
      }
    end

    private

    attr_reader :user

    def normalized_sources
      @sources.map do |source|
        case source
        when Newsletter::AudienceSource
          {
            id: source.id,
            source_type: source.source_type,
            source_settings: source.source_settings.deep_stringify_keys,
          }
        when Hash
          raw_type = source[:source_type] || source["source_type"] || source[:sourceType] || source["sourceType"]
          raw_settings = source[:source_settings] || source["source_settings"] || source[:sourceSettings] || source["sourceSettings"] || {}

          {
            id: source[:id] || source["id"],
            source_type: raw_type.to_s,
            source_settings: raw_settings.is_a?(Hash) ? raw_settings.deep_stringify_keys : {},
          }
        else
          nil
        end
      end.compact.select { |source| Newsletter::AudienceSource::SOURCE_TYPES.include?(source[:source_type]) }
    end

    def recipients_for_source(source)
      case source[:source_type]
      when "contact_list"
        contact_list_recipients(source)
      when "followers"
        followers_recipients
      when "event_attendees"
        event_attendees_recipients(source)
      when "all_my_event_attendees"
        all_my_event_attendees_recipients
      else
        [[], "Fuente desconocida"]
      end
    end

    def contact_list_recipients(source)
      contact_list = user.newsletter_contact_lists.find_by(id: source.dig(:source_settings, "contact_list_id"))
      return [warn_and_return("No pudimos encontrar una lista de contactos"), "Lista no encontrada"] if contact_list.blank?

      recipients = contact_list.contacts.map do |contact|
        build_recipient(
          email: contact.email,
          name: contact.resolved_name,
          first_name: contact.first_name,
          last_name: contact.last_name,
          country: contact.country,
          source_type: "contact_list",
          source_label: contact_list.name,
          data_rank: 2,
        )
      end

      [recipients, contact_list.name]
    end

    def followers_recipients
      recipients = user.followers(User).map do |follower|
        build_recipient(
          email: follower.email,
          name: follower.display_name,
          first_name: follower.first_name,
          last_name: follower.last_name,
          country: follower.country,
          username: follower.username,
          display_name: follower.display_name,
          source_type: "followers",
          source_label: "Followers",
          data_rank: 3,
        )
      end

      [recipients, "Followers"]
    end

    def event_attendees_recipients(source)
      event = Event.find_by(id: source.dig(:source_settings, "event_id"))

      if event.blank?
        return [warn_and_return("No pudimos encontrar el evento seleccionado"), "Evento no encontrado"]
      end

      unless event.can_access_attendees?(user)
        return [warn_and_return("No tienes permisos para usar los asistentes de #{event.title}"), event.title]
      end

      [attendee_recipients_for_event(event, source_type: "event_attendees"), event.title]
    end

    def all_my_event_attendees_recipients
      recipients = user.events.order(updated_at: :desc).flat_map do |event|
        attendee_recipients_for_event(event, source_type: "all_my_event_attendees")
      end

      [recipients, "Asistentes de todos mis eventos"]
    end

    def attendee_recipients_for_event(event, source_type:)
      event.paid_purchased_items
        .includes(:purchased_item, purchase: :user)
        .select { |item| item.purchased_item_type == "EventTicket" }
        .map do |item|
          purchase = item.purchase
          attendee = purchase.user
          attendee_email = attendee&.email.presence || purchase.guest_email.to_s
          attendee_name = attendee&.display_name.presence || attendee&.full_name.presence || attendee_email

          build_recipient(
            email: attendee_email,
            name: attendee_name,
            first_name: attendee&.first_name,
            last_name: attendee&.last_name,
            country: attendee&.country,
            username: attendee&.username,
            display_name: attendee&.display_name,
            source_type: source_type,
            source_label: event.title,
            event_titles: [event.title],
            ticket_titles: [item.purchased_item.try(:title)].compact,
            data_rank: attendee.present? ? 3 : 1,
          )
        end
    end

    def build_recipient(email:, source_type:, source_label:, data_rank:, **attributes)
      {
        email: email.to_s,
        name: attributes[:name].to_s.presence,
        first_name: attributes[:first_name].to_s.presence,
        last_name: attributes[:last_name].to_s.presence,
        country: attributes[:country].to_s.presence,
        username: attributes[:username].to_s.presence,
        display_name: attributes[:display_name].to_s.presence,
        event_titles: Array(attributes[:event_titles]).compact,
        ticket_titles: Array(attributes[:ticket_titles]).compact,
        source_types: [source_type],
        source_labels: [source_label],
        data_rank: data_rank,
      }
    end

    def merge_recipient(existing, incoming)
      merged = existing.dup
      merged[:source_types] = (Array(existing[:source_types]) + Array(incoming[:source_types])).uniq
      merged[:source_labels] = (Array(existing[:source_labels]) + Array(incoming[:source_labels])).uniq
      merged[:event_titles] = (Array(existing[:event_titles]) + Array(incoming[:event_titles])).uniq
      merged[:ticket_titles] = (Array(existing[:ticket_titles]) + Array(incoming[:ticket_titles])).uniq

      if incoming[:data_rank].to_i > existing[:data_rank].to_i
        %i[name first_name last_name country username display_name].each do |field|
          merged[field] = incoming[field].presence || existing[field]
        end
        merged[:data_rank] = incoming[:data_rank]
      else
        %i[name first_name last_name country username display_name].each do |field|
          merged[field] = existing[field].presence || incoming[field]
        end
      end

      merged
    end

    def serialize_recipient(recipient)
      {
        email: recipient[:email],
        name: recipient[:name],
        first_name: recipient[:first_name],
        last_name: recipient[:last_name],
        country: recipient[:country],
        username: recipient[:username],
        display_name: recipient[:display_name],
        event_titles: Array(recipient[:event_titles]),
        ticket_titles: Array(recipient[:ticket_titles]),
        source_types: Array(recipient[:source_types]),
        source_labels: Array(recipient[:source_labels]),
      }
    end

    def source_key(source)
      [source[:source_type], source.dig(:source_settings, "contact_list_id"), source.dig(:source_settings, "event_id")].compact.join(":")
    end

    def warn_and_return(message)
      @warnings << message
      []
    end
  end
end
