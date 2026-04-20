module Admin
  class ResourceRegistry
    class ResourceNotFound < StandardError; end

    class << self
      def nav_items
        [
          {
            key: "commerce",
            label: "Commerce",
            kind: "dashboard",
            icon: "ShoppingCart",
            path: "/admin/commerce"
          },
          {
            key: "listening",
            label: "Listening",
            kind: "dashboard",
            icon: "Headphones",
            path: "/admin/listening"
          },
          {
            key: "event_sales",
            label: "Event Sales",
            kind: "dashboard",
            icon: "Ticket",
            path: "/admin/event-sales"
          },
          {
            key: "pages",
            label: "Pages",
            kind: "resource",
            icon: "FileText",
            path: "/admin/pages",
            creatable: true
          }
        ] + all.map do |key, resource|
          {
            key: key.to_s,
            label: resource[:label],
            kind: "resource",
            icon: resource[:icon],
            path: "/admin/#{key}",
            creatable: resource[:creatable]
          }
        end
      end

      def all
        @all ||= {
          users: {
            label: "Users",
            icon: "Users",
            model: User,
            description: "Manage platform users and moderation roles.",
            creatable: false,
            editable: true,
            destroyable: true,
            search_fields: %w[email username display_name first_name last_name country city stripe_account_id],
            order: ->(relation) { relation.order(created_at: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } },
              { key: "admins", label: "Admins", apply: ->(relation) { relation.where(role: "admin") } },
              { key: "sellers", label: "Sellers", apply: ->(relation) { relation.where(seller: true) } },
              { key: "editors", label: "Editors", apply: ->(relation) { relation.where(editor: true) } },
              { key: "artists", label: "Artists", apply: ->(relation) { relation.where(role: "artist") } },
              { key: "recent", label: "Recent", apply: ->(relation) { relation.where("created_at > ?", 1.week.ago) } }
            ],
            columns: user_columns,
            form_fields: user_form_fields,
            permitted_fields: user_permitted_fields,
            row_actions: lambda { |user|
              actions = default_actions(
                key: :users,
                record: user,
                editable: true,
                destroyable: true
              )
              if user.username.present?
                actions.unshift(
                  {
                    key: "impersonate",
                    label: "Impersonate",
                    kind: "href",
                    href: "/become/#{user.username}"
                  }
                )
              end
              actions
            }
          },
          categories: {
            label: "Categories",
            icon: "FolderTree",
            model: Category,
            description: "Curate site categories and taxonomies.",
            creatable: true,
            editable: true,
            destroyable: true,
            search_fields: %w[name],
            order: ->(relation) { relation.order(:name) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(category) { category.id } },
              { key: "name", label: "Name", type: "text", value: ->(category) { category.name } },
              { key: "slug", label: "Slug", type: "text", value: ->(category) { category.slug } },
              { key: "updated_at", label: "Updated", type: "datetime", value: ->(category) { category.updated_at } }
            ],
            form_fields: [
              { key: "name", label: "Name", type: "text", required: true }
            ],
            permitted_fields: %i[name],
            row_actions: lambda { |category|
              default_actions(
                key: :categories,
                record: category,
                editable: true,
                destroyable: true
              )
            }
          },
          tracks: {
            label: "Tracks",
            icon: "Disc3",
            model: Track,
            description: "Review every track, inspect attachments, run AI analysis, and adjust metadata.",
            creatable: false,
            editable: true,
            destroyable: true,
            search_fields: %w[title caption description genre slug],
            order: ->(relation) { relation.includes(:user).order(id: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } },
              { key: "published", label: "Public", apply: ->(relation) { relation.where(private: [false, nil]) } },
              { key: "private", label: "Private", apply: ->(relation) { relation.where(private: true) } },
              { key: "processed", label: "Processed", apply: ->(relation) { relation.where(state: "processed") } },
              { key: "podcasts", label: "Podcasts", apply: ->(relation) { relation.where(podcast: true) } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(track) { track.id } },
              { key: "title", label: "Title", type: "text", value: ->(track) { track.title } },
              {
                key: "artist",
                label: "Artist",
                type: "text",
                value: ->(track) { track.user&.display_name.presence || track.user&.username }
              },
              { key: "genre", label: "Genre", type: "text", value: ->(track) { track.genre } },
              { key: "bpm", label: "BPM", type: "text", value: ->(track) { track.bpm } },
              { key: "state", label: "State", type: "badge", value: ->(track) { track.state } },
              { key: "private", label: "Private", type: "boolean", value: ->(track) { track.private? } },
              { key: "podcast", label: "Podcast", type: "boolean", value: ->(track) { track.podcast? } },
              { key: "created_at", label: "Created", type: "datetime", value: ->(track) { track.created_at } }
            ],
            form_fields: [
              { key: "id", label: "ID", type: "text", readonly: true, value: ->(track) { track.id } },
              { key: "title", label: "Title", type: "text", required: true },
              { key: "slug", label: "Slug", type: "text", readonly: true, value: ->(track) { track.slug } },
              {
                key: "artist_name",
                label: "Artist",
                type: "text",
                readonly: true,
                value: ->(track) { track.user&.display_name.presence || track.user&.username }
              },
              {
                key: "artist_username",
                label: "Artist username",
                type: "text",
                readonly: true,
                value: ->(track) { track.user&.username }
              },
              {
                key: "artist_email",
                label: "Artist email",
                type: "text",
                readonly: true,
                value: ->(track) { track.user&.email }
              },
              { key: "state", label: "State", type: "text", readonly: true },
              { key: "private", label: "Private", type: "boolean" },
              { key: "podcast", label: "Podcast", type: "boolean" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "genre", label: "Genre", type: "text" },
              { key: "bpm", label: "BPM", type: "text" },
              { key: "musical_key", label: "Key", type: "text" },
              { key: "subgenres", label: "Subgenres", type: "textarea", value: ->(track) { track.subgenres } },
              { key: "mood", label: "Mood", type: "textarea", value: ->(track) { track.mood } },
              { key: "primary_instruments", label: "Primary instruments", type: "textarea", value: ->(track) { track.primary_instruments } },
              { key: "reference_artists", label: "Reference artists", type: "textarea", value: ->(track) { track.reference_artists } },
              { key: "production_traits", label: "Production traits", type: "textarea", value: ->(track) { track.production_traits } },
              { key: "language", label: "Language", type: "text" },
              { key: "energy", label: "Energy", type: "text" },
              { key: "danceability", label: "Danceability", type: "text" },
              { key: "instrumental", label: "Instrumental", type: "boolean" },
              { key: "vocal_presence", label: "Vocal presence", type: "text" },
              { key: "analysis_accuracy", label: "Analysis accuracy", type: "text" },
              { key: "analysis_notes", label: "Analysis notes", type: "textarea" },
              { key: "bpm_range", label: "BPM range", type: "textarea", readonly: true, value: ->(track) { track.bpm_range } },
              { key: "confidence_breakdown", label: "Confidence breakdown", type: "textarea", readonly: true, value: ->(track) { track.confidence_breakdown } },
              { key: "analysis_source_metadata", label: "Analysis source metadata", type: "textarea", readonly: true, value: ->(track) { track.analysis_source_metadata } },
              { key: "analysis_window", label: "Analysis window", type: "textarea", readonly: true, value: ->(track) { track.analysis_window } },
              { key: "analysis_model", label: "Analysis model", type: "text", readonly: true },
              { key: "analyzed_at", label: "Analyzed at", type: "datetime", readonly: true },
              { key: "tags", label: "Tags", type: "textarea", value: ->(track) { track.tags } },
              { key: "duration", label: "Duration", type: "text", readonly: true, value: ->(track) { track.duration } },
              {
                key: "cover_url",
                label: "Cover URL",
                type: "text",
                readonly: true,
                value: ->(track) {
                  next unless track.cover.attached?
                  Rails.application.routes.url_helpers.rails_storage_proxy_path(track.cover, only_path: true)
                }
              },
              {
                key: "playback_url",
                label: "Playback URL",
                type: "text",
                readonly: true,
                value: ->(track) {
                  media = track.playback_media
                  next unless media&.attached?
                  Rails.application.routes.url_helpers.rails_storage_proxy_path(media, only_path: true)
                }
              },
              {
                key: "audio_url",
                label: "Audio URL",
                type: "text",
                readonly: true,
                value: ->(track) {
                  next unless track.audio.attached?
                  Rails.application.routes.url_helpers.rails_storage_proxy_path(track.audio, only_path: true)
                }
              },
              {
                key: "mp3_url",
                label: "MP3 URL",
                type: "text",
                readonly: true,
                value: ->(track) {
                  next unless track.mp3_audio.attached?
                  Rails.application.routes.url_helpers.rails_storage_proxy_path(track.mp3_audio, only_path: true)
                }
              },
              {
                key: "video_url",
                label: "Video URL",
                type: "text",
                readonly: true,
                value: ->(track) {
                  media = track.video_playback_media
                  next unless media&.attached?
                  Rails.application.routes.url_helpers.rails_storage_proxy_path(media, only_path: true)
                }
              },
              {
                key: "public_url",
                label: "Public URL",
                type: "text",
                readonly: true,
                value: ->(track) {
                  next if track.private?
                  "/tracks/#{track.slug.presence || track.id}"
                }
              },
              { key: "created_at", label: "Created at", type: "datetime", readonly: true },
              { key: "updated_at", label: "Updated at", type: "datetime", readonly: true }
            ],
            permitted_fields: [
              :title,
              :description,
              :private,
              :podcast,
              :genre,
              :bpm,
              :musical_key,
              :language,
              :energy,
              :danceability,
              :instrumental,
              :vocal_presence,
              :analysis_accuracy,
              :analysis_notes,
              { bpm_range: %i[min max] },
              { subgenres: [] },
              { mood: [] },
              { primary_instruments: [] },
              { reference_artists: [] },
              { production_traits: [] },
              { tags: [] }
            ],
            custom_actions: [
              {
                key: "analyze",
                label: "Analyze",
                run: lambda { |track, payload|
                  TrackAudioAnalysisService.new(
                    track: track,
                    start_seconds: payload["start_seconds"],
                    duration_seconds: payload["duration_seconds"],
                    persist: payload["persist"]
                  ).call
                }
              }
            ],
            row_actions: lambda { |track|
              actions = []
              actions << {
                key: "review",
                label: "Review",
                kind: "navigate",
                to: "/admin/tracks/#{track.id}"
              }
              unless track.private?
                actions << {
                  key: "view",
                  label: "Open track",
                  kind: "link",
                  to: "/tracks/#{track.slug.presence || track.id}"
                }
              end
              actions << {
                key: "delete",
                label: "Delete",
                kind: "delete",
                endpoint: "/api/admin/tracks/#{track.id}"
              }
              actions
            }
          },
          events: {
            label: "Events",
            icon: "CalendarDays",
            model: Event,
            description: "Review upcoming and past events across the platform.",
            creatable: false,
            editable: false,
            destroyable: true,
            search_fields: %w[title description venue city country slug],
            order: ->(relation) { relation.includes(:user).order(id: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } },
              { key: "published", label: "Published", apply: ->(relation) { relation.where(state: "published") } },
              { key: "drafts", label: "Drafts", apply: ->(relation) { relation.where(state: "draft") } },
              { key: "upcoming", label: "Upcoming", apply: ->(relation) { relation.where("event_start >= ?", Time.current) } },
              { key: "past", label: "Past", apply: ->(relation) { relation.where("event_start < ?", Time.current) } },
              { key: "public", label: "Public", apply: ->(relation) { relation.where(visibility: "public") } },
              { key: "private", label: "Private", apply: ->(relation) { relation.where(visibility: "private") } },
              { key: "unlisted", label: "Unlisted", apply: ->(relation) { relation.where(visibility: "unlisted") } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(event) { event.id } },
              { key: "title", label: "Title", type: "text", value: ->(event) { event.title } },
              {
                key: "organizer",
                label: "Organizer",
                type: "text",
                value: ->(event) { event.user&.display_name.presence || event.user&.username }
              },
              { key: "state", label: "State", type: "badge", value: ->(event) { event.state } },
              { key: "visibility", label: "Visibility", type: "badge", value: ->(event) { event.visibility } },
              { key: "event_start", label: "Starts", type: "datetime", value: ->(event) { event.event_start } },
              { key: "created_at", label: "Created", type: "datetime", value: ->(event) { event.created_at } }
            ],
            form_fields: [],
            permitted_fields: [],
            row_actions: lambda { |event|
              actions = []
              if event.state == "published" && !event.private?
                actions << {
                  key: "view",
                  label: "Open event",
                  kind: "link",
                  to: "/events/#{event.slug.presence || event.id}"
                }
              end
              actions << {
                key: "delete",
                label: "Delete",
                kind: "delete",
                endpoint: "/api/admin/events/#{event.id}"
              }
              actions
            }
          },
          posts: {
            label: "Posts",
            icon: "Newspaper",
            model: Post,
            description: "Review editorial content and jump to the article editor.",
            creatable: false,
            editable: false,
            destroyable: true,
            search_fields: %w[title excerpt],
            order: ->(relation) { relation.includes(:user).order(updated_at: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } },
              { key: "published", label: "Published", apply: ->(relation) { relation.published } },
              { key: "draft", label: "Drafts", apply: ->(relation) { relation.draft } },
              { key: "recent", label: "Recent", apply: ->(relation) { relation.where("created_at > ?", 1.week.ago) } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(post) { post.id } },
              { key: "title", label: "Title", type: "text", value: ->(post) { post.title } },
              {
                key: "author",
                label: "Author",
                type: "text",
                value: ->(post) { post.user&.display_name.presence || post.user&.username }
              },
              { key: "state", label: "State", type: "badge", value: ->(post) { post.state } },
              { key: "private", label: "Private", type: "boolean", value: ->(post) { post.private? } },
              { key: "updated_at", label: "Updated", type: "datetime", value: ->(post) { post.updated_at } }
            ],
            form_fields: [],
            permitted_fields: [],
            row_actions: lambda { |post|
              [
                {
                  key: "view",
                  label: "Open post",
                  kind: "link",
                  to: "/articles/#{post.slug}"
                },
                {
                  key: "edit",
                  label: "Open editor",
                  kind: "link",
                  to: "/articles/#{post.id}/edit"
                },
                {
                  key: "delete",
                  label: "Delete",
                  kind: "delete",
                  endpoint: "/api/admin/posts/#{post.id}"
                }
              ]
            }
          },
          terms_and_conditions: {
            label: "Terms",
            icon: "FileText",
            model: TermsAndCondition,
            description: "Edit legal copy and policy content.",
            creatable: true,
            editable: true,
            destroyable: true,
            search_fields: %w[title category content],
            order: ->(relation) { relation.order(updated_at: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(record) { record.id } },
              { key: "title", label: "Title", type: "text", value: ->(record) { record.title } },
              { key: "category", label: "Category", type: "badge", value: ->(record) { record.category } },
              { key: "updated_at", label: "Updated", type: "datetime", value: ->(record) { record.updated_at } }
            ],
            form_fields: [
              { key: "title", label: "Title", type: "text", required: true },
              { key: "category", label: "Category", type: "text", required: true },
              { key: "content", label: "Content", type: "textarea", required: true }
            ],
            permitted_fields: %i[title category content],
            row_actions: lambda { |record|
              default_actions(
                key: :terms_and_conditions,
                record: record,
                editable: true,
                destroyable: true
              )
            }
          },
          interest_alerts: {
            label: "Interest Alerts",
            icon: "Bell",
            model: InterestAlert,
            description: "Review inbound creator and seller requests.",
            creatable: false,
            editable: true,
            destroyable: false,
            search_fields: %w[role body],
            order: ->(relation) { relation.includes(:user).order(created_at: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } },
              { key: "pending", label: "Pending", apply: ->(relation) { relation.where(approved: false) } },
              { key: "approved", label: "Approved", apply: ->(relation) { relation.where(approved: true) } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(alert) { alert.id } },
              {
                key: "user",
                label: "User",
                type: "text",
                value: ->(alert) { alert.user&.display_name.presence || alert.user&.username }
              },
              { key: "role", label: "Role", type: "badge", value: ->(alert) { alert.role } },
              {
                key: "body_preview",
                label: "Message",
                type: "text",
                value: ->(alert) { alert.body.to_s.squish.truncate(120) }
              },
              { key: "approved", label: "Approved", type: "boolean", value: ->(alert) { alert.approved? } },
              { key: "created_at", label: "Created", type: "datetime", value: ->(alert) { alert.created_at } }
            ],
            form_fields: [
              {
                key: "user_name",
                label: "User",
                type: "text",
                readonly: true,
                value: ->(alert) { alert.user&.display_name.presence || alert.user&.username }
              },
              { key: "role", label: "Role", type: "text", readonly: true },
              { key: "body", label: "Message", type: "textarea", readonly: true },
              { key: "approved", label: "Approved", type: "boolean" }
            ],
            permitted_fields: %i[approved],
            custom_actions: [
              {
                key: "approve",
                label: "Approve request",
                visible: ->(alert) { !alert.approved? },
                run: lambda { |alert|
                  alert.approve!
                  { message: "Request approved successfully" }
                }
              }
            ],
            row_actions: lambda { |alert|
              actions = [
                {
                  key: "review",
                  label: "Review",
                  kind: "navigate",
                  to: "/admin/interest_alerts/#{alert.id}"
                }
              ]
              if !alert.approved?
                actions.unshift(
                  {
                    key: "approve",
                    label: "Approve",
                    kind: "custom",
                    endpoint: "/api/admin/interest_alerts/#{alert.id}/actions/approve"
                  }
                )
              end
              actions
            }
          }
        }
      end

      def fetch!(key)
        all.fetch(key.to_sym)
      rescue KeyError
        raise ResourceNotFound, "Unknown admin resource: #{key}"
      end

      def scope_for(resource, key)
        resource[:scopes].find { |scope| scope[:key].to_s == key.to_s } || resource[:scopes].first
      end

      def serialize_definition(key, resource)
        {
          key: key.to_s,
          label: resource[:label],
          icon: resource[:icon],
          description: resource[:description],
          creatable: resource[:creatable],
          editable: resource[:editable],
          destroyable: resource[:destroyable],
          columns: resource[:columns].map { |column| serialize_column(column) },
          form_fields: resource[:form_fields].map { |field| serialize_field(field) },
          scopes: resource[:scopes].map { |scope| { key: scope[:key].to_s, label: scope[:label] } }
        }
      end

      private

      def serialize_column(column)
        {
          key: column[:key].to_s,
          label: column[:label],
          type: column[:type] || "text"
        }
      end

      def serialize_field(field)
        {
          key: field[:key].to_s,
          label: field[:label],
          type: field[:type] || "text",
          readonly: field[:readonly] || false,
          required: field[:required] || false,
          section: field[:section],
          description: field[:description],
          options: resolve_options(field[:options])
        }
      end

      def resolve_options(options)
        resolved = options.respond_to?(:call) ? options.call : options
        Array(resolved).map do |entry|
          if entry.is_a?(Hash)
            { label: entry[:label] || entry["label"], value: entry[:value] || entry["value"] }
          elsif entry.is_a?(Array)
            { label: entry[0], value: entry[1] }
          else
            { label: entry.to_s.humanize, value: entry }
          end
        end
      end

      def user_columns
        [
          { key: "id", label: "ID", type: "number", value: ->(user) { user.id } },
          { key: "email", label: "Email", type: "text", value: ->(user) { user.email } },
          { key: "username", label: "Username", type: "text", value: ->(user) { user.username } },
          { key: "display_name", label: "Name", type: "text", value: ->(user) { user.display_name } },
          { key: "role", label: "Role", type: "badge", value: ->(user) { user.role } },
          { key: "label", label: "Label", type: "boolean", value: ->(user) { user.label? } },
          { key: "seller", label: "Seller", type: "boolean", value: ->(user) { user.seller? } },
          { key: "editor", label: "Editor", type: "boolean", value: ->(user) { user.editor? } },
          { key: "stripe_active", label: "Stripe", type: "boolean", value: ->(user) { user.stripe_account_id.present? } },
          { key: "created_at", label: "Created", type: "datetime", value: ->(user) { user.created_at } }
        ]
      end

      def user_form_fields
        [
          { key: "email", label: "Email", type: "email", required: true, section: "Identity" },
          { key: "username", label: "Username", type: "text", required: true, section: "Identity" },
          { key: "display_name", label: "Display name", type: "text", section: "Identity" },
          { key: "first_name", label: "First name", type: "text", section: "Identity" },
          { key: "last_name", label: "Last name", type: "text", section: "Identity" },
          { key: "country", label: "Country", type: "text", section: "Identity" },
          { key: "city", label: "City", type: "text", section: "Identity" },
          { key: "bio", label: "Bio", type: "textarea", section: "Identity" },
          {
            key: "role",
            label: "Role",
            type: "select",
            required: true,
            section: "Permissions",
            options: -> { User.roles.keys.map { |role| { label: role.humanize, value: role } } }
          },
          { key: "label", label: "Label account", type: "boolean", section: "Permissions" },
          { key: "seller", label: "Seller", type: "boolean", section: "Permissions" },
          { key: "editor", label: "Editor", type: "boolean", section: "Permissions" },
          { key: "featured", label: "Featured", type: "boolean", section: "Permissions" },
          { key: "support_link", label: "Support link", type: "text", section: "Permissions" },
          {
            key: "can_send_newsletter",
            label: "Can send newsletter",
            type: "boolean",
            section: "Newsletter",
            description: "Enables access to newsletter templates, audiences, and broadcasts."
          },
          {
            key: "newsletter_broadcast_recipient_limit",
            label: "Recipient limit per newsletter",
            type: "number",
            section: "Newsletter",
            description: "Maximum unique recipients allowed for a single broadcast."
          },
          {
            key: "stripe_active",
            label: "Stripe activated",
            type: "boolean",
            readonly: true,
            section: "Payments",
            description: "Derived from the connected Stripe account.",
            value: ->(user) { user.stripe_account_id.present? }
          },
          {
            key: "stripe_account_id",
            label: "Stripe account ID",
            type: "text",
            readonly: true,
            section: "Payments",
            value: ->(user) { user.stripe_account_id }
          },
          {
            key: "tbk_commerce_code",
            label: "Transbank commerce code",
            type: "text",
            section: "Payments"
          },
          {
            key: "tbk_test_mode",
            label: "Transbank test mode",
            type: "boolean",
            section: "Payments"
          },
          {
            key: "hide_username_from_profile",
            label: "Hide username from profile",
            type: "boolean",
            section: "Profile settings"
          },
          {
            key: "pst_enabled",
            label: "PST enabled",
            type: "boolean",
            section: "Profile settings"
          },
          {
            key: "email_sign_up",
            label: "Email sign-up enabled",
            type: "boolean",
            section: "Profile settings"
          },
          {
            key: "google_analytics_id",
            label: "Google Analytics ID",
            type: "text",
            section: "Profile settings"
          },
          {
            key: "facebook_pixel_id",
            label: "Facebook Pixel ID",
            type: "text",
            section: "Profile settings"
          },
          { key: "social_title", label: "Social title", type: "text", section: "Profile settings" },
          {
            key: "social_description",
            label: "Social description",
            type: "textarea",
            section: "Profile settings"
          },
          {
            key: "sensitive_content",
            label: "Sensitive content",
            type: "boolean",
            section: "Profile settings"
          },
          {
            key: "age_restriction",
            label: "Age restriction",
            type: "select",
            section: "Profile settings",
            options: user_age_restriction_options
          },
          { key: "new_follower_email", label: "New follower email", type: "boolean", section: "Notifications" },
          { key: "new_follower_app", label: "New follower in app", type: "boolean", section: "Notifications" },
          { key: "repost_of_your_post_email", label: "Repost email", type: "boolean", section: "Notifications" },
          { key: "repost_of_your_post_app", label: "Repost in app", type: "boolean", section: "Notifications" },
          {
            key: "new_post_by_followed_user_email",
            label: "Followed user post email",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "new_post_by_followed_user_app",
            label: "Followed user post in app",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "like_and_plays_on_your_post_email",
            label: "Likes and plays email",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "like_and_plays_on_your_post_app",
            label: "Likes and plays in app",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "comment_on_your_post_email",
            label: "Comment email",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "comment_on_your_post_app",
            label: "Comment in app",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "suggested_content_email",
            label: "Suggested content email",
            type: "boolean",
            section: "Notifications"
          },
          {
            key: "suggested_content_app",
            label: "Suggested content in app",
            type: "boolean",
            section: "Notifications"
          },
          { key: "new_message_email", label: "New message email", type: "boolean", section: "Notifications" },
          { key: "new_message_app", label: "New message in app", type: "boolean", section: "Notifications" }
        ]
      end

      def user_permitted_fields
        %i[
          email
          username
          display_name
          first_name
          last_name
          country
          city
          bio
          role
          label
          seller
          editor
          featured
          support_link
          can_send_newsletter
          newsletter_broadcast_recipient_limit
          tbk_commerce_code
          tbk_test_mode
          hide_username_from_profile
          pst_enabled
          email_sign_up
          google_analytics_id
          facebook_pixel_id
          social_title
          social_description
          sensitive_content
          age_restriction
          new_follower_email
          new_follower_app
          repost_of_your_post_email
          repost_of_your_post_app
          new_post_by_followed_user_email
          new_post_by_followed_user_app
          like_and_plays_on_your_post_email
          like_and_plays_on_your_post_app
          comment_on_your_post_email
          comment_on_your_post_app
          suggested_content_email
          suggested_content_app
          new_message_email
          new_message_app
        ]
      end

      def user_age_restriction_options
        [
          { label: "All ages", value: "all" },
          { label: "13+", value: "13" },
          { label: "14+", value: "14" },
          { label: "16+", value: "16" },
          { label: "18+", value: "18" },
          { label: "21+", value: "21" }
        ]
      end

      def default_actions(key:, record:, editable:, destroyable:)
        actions = []
        actions << {
          key: "edit",
          label: "Edit",
          kind: "navigate",
          to: "/admin/#{key}/#{record.id}"
        } if editable
        actions << {
          key: "delete",
          label: "Delete",
          kind: "delete",
          endpoint: "/api/admin/#{key}/#{record.id}"
        } if destroyable
        actions
      end
    end
  end
end
