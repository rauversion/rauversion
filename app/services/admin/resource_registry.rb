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
            search_fields: %w[email username display_name],
            order: ->(relation) { relation.order(created_at: :desc) },
            scopes: [
              { key: "all", label: "All", apply: ->(relation) { relation } },
              { key: "admins", label: "Admins", apply: ->(relation) { relation.where(role: "admin") } },
              { key: "sellers", label: "Sellers", apply: ->(relation) { relation.where(seller: true) } },
              { key: "editors", label: "Editors", apply: ->(relation) { relation.where(editor: true) } },
              { key: "artists", label: "Artists", apply: ->(relation) { relation.where(role: "artist") } },
              { key: "recent", label: "Recent", apply: ->(relation) { relation.where("created_at > ?", 1.week.ago) } }
            ],
            columns: [
              { key: "id", label: "ID", type: "number", value: ->(user) { user.id } },
              { key: "email", label: "Email", type: "text", value: ->(user) { user.email } },
              { key: "username", label: "Username", type: "text", value: ->(user) { user.username } },
              { key: "role", label: "Role", type: "badge", value: ->(user) { user.role } },
              { key: "seller", label: "Seller", type: "boolean", value: ->(user) { user.seller? } },
              { key: "editor", label: "Editor", type: "boolean", value: ->(user) { user.editor? } },
              { key: "created_at", label: "Created", type: "datetime", value: ->(user) { user.created_at } }
            ],
            form_fields: [
              { key: "email", label: "Email", type: "email", required: true },
              { key: "username", label: "Username", type: "text", required: true },
              {
                key: "role",
                label: "Role",
                type: "select",
                required: true,
                options: -> { User.roles.keys.map { |role| { label: role.humanize, value: role } } }
              },
              { key: "seller", label: "Seller", type: "boolean" },
              { key: "editor", label: "Editor", type: "boolean" }
            ],
            permitted_fields: %i[email username role seller editor],
            row_actions: lambda { |user|
              default_actions(
                key: :users,
                record: user,
                editable: true,
                destroyable: true
              )
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
            description: "Review track uploads, moderation state, and recent releases.",
            creatable: false,
            editable: false,
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
              { key: "state", label: "State", type: "badge", value: ->(track) { track.state } },
              { key: "private", label: "Private", type: "boolean", value: ->(track) { track.private? } },
              { key: "podcast", label: "Podcast", type: "boolean", value: ->(track) { track.podcast? } },
              { key: "created_at", label: "Created", type: "datetime", value: ->(track) { track.created_at } }
            ],
            form_fields: [],
            permitted_fields: [],
            row_actions: lambda { |track|
              actions = []
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
              actions = default_actions(
                key: :interest_alerts,
                record: alert,
                editable: true,
                destroyable: false
              )
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
