# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_11_10_035932) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.string "slug"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "comments", force: :cascade do |t|
    t.string "commentable_type", null: false
    t.bigint "commentable_id", null: false
    t.bigint "user_id", null: false
    t.text "body"
    t.integer "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["commentable_type", "commentable_id"], name: "index_comments_on_commentable"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "connected_accounts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "state"
    t.bigint "parent_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password"
    t.index ["parent_id"], name: "index_connected_accounts_on_parent_id"
    t.index ["user_id"], name: "index_connected_accounts_on_user_id"
  end

  create_table "conversations", force: :cascade do |t|
    t.string "subject"
    t.string "messageable_type", null: false
    t.bigint "messageable_id", null: false
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["messageable_type", "messageable_id"], name: "index_conversations_on_messageable"
  end

  create_table "coupons", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "code", null: false
    t.string "discount_type", null: false
    t.decimal "discount_amount", precision: 10, scale: 2, null: false
    t.datetime "expires_at", null: false
    t.string "stripe_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_coupons_on_code", unique: true
    t.index ["user_id"], name: "index_coupons_on_user_id"
  end

  create_table "course_documents", force: :cascade do |t|
    t.bigint "lesson_id"
    t.string "title"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "course_id", null: false
    t.index ["course_id"], name: "index_course_documents_on_course_id"
    t.index ["lesson_id"], name: "index_course_documents_on_lesson_id"
  end

  create_table "course_enrollments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "course_id", null: false
    t.jsonb "progress"
    t.jsonb "metadata"
    t.datetime "enrolled_at"
    t.datetime "completed_at"
    t.datetime "last_accessed_at"
    t.string "status", default: "enrolled"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_course_enrollments_on_course_id"
    t.index ["user_id"], name: "index_course_enrollments_on_user_id"
  end

  create_table "course_modules", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.string "title"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "position"
    t.index ["course_id"], name: "index_course_modules_on_course_id"
  end

  create_table "courses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title"
    t.text "description"
    t.string "category"
    t.string "level"
    t.string "duration"
    t.decimal "price"
    t.string "instructor"
    t.string "instructor_title"
    t.boolean "is_published"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "seo_title"
    t.text "seo_description"
    t.string "seo_keywords"
    t.integer "max_students", default: 0
    t.string "enrollment_type"
    t.boolean "certificate"
    t.boolean "featured"
    t.boolean "published"
    t.string "slug"
    t.index ["user_id"], name: "index_courses_on_user_id"
  end

  create_table "event_hosts", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.bigint "event_id", null: false
    t.bigint "user_id", null: false
    t.boolean "listed_on_page"
    t.boolean "event_manager"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_event_hosts_on_event_id"
    t.index ["user_id"], name: "index_event_hosts_on_user_id"
  end

  create_table "event_recordings", force: :cascade do |t|
    t.string "type"
    t.string "title"
    t.text "description"
    t.text "iframe"
    t.jsonb "properties"
    t.integer "position"
    t.bigint "event_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_event_recordings_on_event_id"
  end

  create_table "event_schedules", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.datetime "start_date"
    t.datetime "end_date"
    t.string "schedule_type"
    t.string "name"
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_event_schedules_on_event_id"
  end

  create_table "event_tickets", force: :cascade do |t|
    t.string "title"
    t.decimal "price"
    t.decimal "early_bird_price"
    t.decimal "standard_price"
    t.integer "qty"
    t.datetime "selling_start"
    t.datetime "selling_end"
    t.string "short_description"
    t.jsonb "settings"
    t.bigint "event_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.index ["deleted_at"], name: "index_event_tickets_on_deleted_at"
    t.index ["event_id"], name: "index_event_tickets_on_event_id"
  end

  create_table "events", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.string "slug"
    t.string "state"
    t.string "timezone"
    t.datetime "event_start"
    t.datetime "event_ends"
    t.boolean "private"
    t.boolean "online"
    t.string "location"
    t.string "street"
    t.string "street_number"
    t.decimal "lat", precision: 10, scale: 6
    t.decimal "lng", precision: 10, scale: 6
    t.string "venue"
    t.string "country"
    t.string "city"
    t.string "province"
    t.string "postal"
    t.string "age_requirement"
    t.boolean "event_capacity"
    t.integer "event_capacity_limit"
    t.boolean "eticket"
    t.boolean "will_call"
    t.jsonb "order_form"
    t.jsonb "widget_button"
    t.string "event_short_link"
    t.jsonb "tax_rates_settings"
    t.jsonb "attendee_list_settings"
    t.jsonb "scheduling_settings"
    t.jsonb "event_settings"
    t.jsonb "tickets"
    t.bigint "user_id", null: false
    t.jsonb "streaming_service", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_events_on_user_id"
  end

  create_table "follows", force: :cascade do |t|
    t.string "follower_type"
    t.integer "follower_id"
    t.string "followable_type"
    t.integer "followable_id"
    t.datetime "created_at"
    t.index ["followable_id", "followable_type"], name: "fk_followables"
    t.index ["follower_id", "follower_type"], name: "fk_follows"
  end

  create_table "friendly_id_slugs", force: :cascade do |t|
    t.string "slug", null: false
    t.integer "sluggable_id", null: false
    t.string "sluggable_type", limit: 50
    t.string "scope"
    t.datetime "created_at"
    t.index ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true
    t.index ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type"
    t.index ["sluggable_type", "sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_type_and_sluggable_id"
  end

  create_table "interest_alerts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "body", null: false
    t.string "role", null: false
    t.boolean "approved", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_interest_alerts_on_user_id"
  end

  create_table "lessons", force: :cascade do |t|
    t.bigint "course_module_id", null: false
    t.string "title"
    t.string "duration"
    t.string "lesson_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.string "type"
    t.bigint "position"
    t.index ["course_module_id"], name: "index_lessons_on_course_module_id"
  end

  create_table "likes", force: :cascade do |t|
    t.string "liker_type"
    t.integer "liker_id"
    t.string "likeable_type"
    t.integer "likeable_id"
    t.datetime "created_at"
    t.index ["likeable_id", "likeable_type"], name: "fk_likeables"
    t.index ["liker_id", "liker_type"], name: "fk_likes"
  end

  create_table "link_services", force: :cascade do |t|
    t.string "name"
    t.string "icon"
    t.string "url_pattern"
    t.boolean "active", default: true
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_link_services_on_active"
    t.index ["position"], name: "index_link_services_on_position"
  end

  create_table "listening_events", force: :cascade do |t|
    t.string "remote_ip"
    t.string "country"
    t.string "city"
    t.string "ua"
    t.string "lang"
    t.string "referer"
    t.string "utm_medium"
    t.string "utm_source"
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "utm_term"
    t.string "browser_name"
    t.string "browser_version"
    t.string "modern"
    t.string "platform"
    t.string "device_type"
    t.boolean "bot"
    t.boolean "search_engine"
    t.integer "resource_profile_id"
    t.integer "user_id"
    t.integer "track_id"
    t.integer "playlist_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "mentions", force: :cascade do |t|
    t.string "mentioner_type"
    t.integer "mentioner_id"
    t.string "mentionable_type"
    t.integer "mentionable_id"
    t.datetime "created_at"
    t.index ["mentionable_id", "mentionable_type"], name: "fk_mentionables"
    t.index ["mentioner_id", "mentioner_type"], name: "fk_mentions"
  end

  create_table "message_reads", force: :cascade do |t|
    t.bigint "message_id", null: false
    t.bigint "participant_id", null: false
    t.datetime "read_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["message_id", "participant_id"], name: "index_message_reads_on_message_id_and_participant_id", unique: true
    t.index ["message_id"], name: "index_message_reads_on_message_id"
    t.index ["participant_id"], name: "index_message_reads_on_participant_id"
  end

  create_table "messages", force: :cascade do |t|
    t.text "body"
    t.bigint "conversation_id", null: false
    t.bigint "user_id", null: false
    t.string "message_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["user_id"], name: "index_messages_on_user_id"
  end

  create_table "nondisposable_disposable_domains", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_nondisposable_disposable_domains_on_name", unique: true
  end

  create_table "oauth_credentials", force: :cascade do |t|
    t.string "uid"
    t.string "token"
    t.jsonb "data"
    t.string "provider"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_oauth_credentials_on_user_id"
  end

  create_table "pages", force: :cascade do |t|
    t.jsonb "body"
    t.string "title"
    t.string "slug"
    t.boolean "published"
    t.string "menu"
    t.jsonb "settings"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_pages_on_slug"
  end

  create_table "participants", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "conversation_id", null: false
    t.string "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id"], name: "index_participants_on_conversation_id"
    t.index ["user_id"], name: "index_participants_on_user_id"
  end

  create_table "photos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "description"
    t.string "tags", default: [], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_photos_on_user_id"
  end

  create_table "plain_conversations", force: :cascade do |t|
    t.string "subject"
    t.datetime "pinned_at"
    t.boolean "pinned"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "plain_messages", force: :cascade do |t|
    t.string "role"
    t.text "content"
    t.bigint "plain_conversation_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["plain_conversation_id"], name: "index_plain_messages_on_plain_conversation_id"
  end

  create_table "playlists", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title"
    t.string "slug"
    t.text "description"
    t.jsonb "metadata"
    t.boolean "private"
    t.string "playlist_type"
    t.datetime "release_date"
    t.string "genre"
    t.string "custom_genre"
    t.integer "likes_count"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "tags", default: [], array: true
    t.integer "label_id"
    t.integer "editor_choice_position"
    t.index ["label_id"], name: "index_playlists_on_label_id"
    t.index ["slug"], name: "index_playlists_on_slug"
    t.index ["tags"], name: "index_playlists_on_tags", using: :gin
    t.index ["user_id"], name: "index_playlists_on_user_id"
  end

  create_table "podcaster_hosts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "podcaster_info_id", null: false
    t.string "role", default: "host"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["podcaster_info_id"], name: "index_podcaster_hosts_on_podcaster_info_id"
    t.index ["user_id", "podcaster_info_id"], name: "index_podcaster_hosts_on_user_id_and_podcaster_info_id", unique: true
    t.index ["user_id"], name: "index_podcaster_hosts_on_user_id"
  end

  create_table "podcaster_infos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "description"
    t.text "title"
    t.text "about"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "settings"
    t.boolean "highlight"
    t.jsonb "data"
    t.boolean "active"
    t.index ["user_id"], name: "index_podcaster_infos_on_user_id"
  end

  create_table "posts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.jsonb "body"
    t.jsonb "settings"
    t.boolean "private"
    t.text "excerpt"
    t.string "title"
    t.string "slug"
    t.string "state"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "category_id"
    t.string "tags", default: [], array: true
    t.index ["category_id"], name: "index_posts_on_category_id"
    t.index ["slug"], name: "index_posts_on_slug"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "press_kits", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "bio"
    t.text "press_release"
    t.text "technical_rider"
    t.text "stage_plot"
    t.text "booking_info"
    t.jsonb "settings", default: {}
    t.boolean "published", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "editor_data", default: {}
    t.boolean "use_builder", default: false
    t.index ["editor_data"], name: "index_press_kits_on_editor_data", using: :gin
    t.index ["published"], name: "index_press_kits_on_published"
    t.index ["user_id"], name: "index_press_kits_on_user_id"
  end

  create_table "preview_cards", force: :cascade do |t|
    t.string "url"
    t.string "title"
    t.text "description"
    t.string "type"
    t.string "author_name"
    t.string "author_url"
    t.text "html"
    t.string "image"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "product_cart_items", force: :cascade do |t|
    t.bigint "product_cart_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_cart_id"], name: "index_product_cart_items_on_product_cart_id"
    t.index ["product_id"], name: "index_product_cart_items_on_product_id"
  end

  create_table "product_carts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_product_carts_on_user_id"
  end

  create_table "product_images", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "title"
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_images_on_product_id"
  end

  create_table "product_options", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "name", null: false
    t.integer "quantity"
    t.string "sku", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_options_on_product_id"
    t.index ["sku"], name: "index_product_options_on_sku", unique: true
  end

  create_table "product_purchase_items", force: :cascade do |t|
    t.bigint "product_purchase_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity"
    t.decimal "price"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "shipping_cost"
    t.string "currency", default: "usd", null: false
    t.index ["product_id"], name: "index_product_purchase_items_on_product_id"
    t.index ["product_purchase_id"], name: "index_product_purchase_items_on_product_purchase_id"
  end

  create_table "product_purchases", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.decimal "total_amount"
    t.string "status"
    t.string "stripe_session_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "shipping_address"
    t.string "shipping_name"
    t.string "phone"
    t.decimal "shipping_cost"
    t.string "tracking_code"
    t.string "payment_intent_id"
    t.string "shipping_status"
    t.string "currency", default: "usd", null: false
    t.index ["shipping_status"], name: "index_product_purchases_on_shipping_status"
    t.index ["user_id"], name: "index_product_purchases_on_user_id"
  end

  create_table "product_shippings", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "country"
    t.decimal "base_cost", precision: 10, scale: 2
    t.decimal "additional_cost", precision: 10, scale: 2
    t.boolean "is_default", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_shippings_on_product_id"
  end

  create_table "product_variants", force: :cascade do |t|
    t.string "name"
    t.decimal "price"
    t.integer "stock_quantity"
    t.bigint "product_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_variants_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.decimal "price"
    t.integer "stock_quantity"
    t.string "sku"
    t.string "category"
    t.string "status"
    t.bigint "user_id", null: false
    t.bigint "playlist_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "limited_edition", default: false
    t.integer "limited_edition_count"
    t.boolean "include_digital_album", default: false
    t.string "visibility", default: "private"
    t.boolean "name_your_price", default: false
    t.integer "shipping_days"
    t.date "shipping_begins_on"
    t.decimal "shipping_within_country_price", precision: 10, scale: 2
    t.decimal "shipping_worldwide_price", precision: 10, scale: 2
    t.integer "quantity"
    t.string "slug"
    t.datetime "deleted_at"
    t.bigint "coupon_id"
    t.string "condition"
    t.string "brand"
    t.string "model"
    t.integer "year"
    t.boolean "accept_barter", default: false
    t.text "barter_description"
    t.jsonb "data"
    t.string "type"
    t.bigint "course_id"
    t.index ["accept_barter"], name: "index_products_on_accept_barter"
    t.index ["brand"], name: "index_products_on_brand"
    t.index ["condition"], name: "index_products_on_condition"
    t.index ["coupon_id"], name: "index_products_on_coupon_id"
    t.index ["course_id"], name: "index_products_on_course_id"
    t.index ["deleted_at"], name: "index_products_on_deleted_at"
    t.index ["model"], name: "index_products_on_model"
    t.index ["playlist_id"], name: "index_products_on_playlist_id"
    t.index ["slug"], name: "index_products_on_slug"
    t.index ["user_id"], name: "index_products_on_user_id"
    t.index ["year"], name: "index_products_on_year"
  end

  create_table "products_images", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "title"
    t.string "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_products_images_on_product_id"
  end

  create_table "purchased_items", force: :cascade do |t|
    t.bigint "purchase_id", null: false
    t.string "purchased_item_type", null: false
    t.bigint "purchased_item_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "state"
    t.boolean "checked_in"
    t.datetime "checked_in_at"
    t.datetime "refunded_at"
    t.string "refund_id"
    t.decimal "price"
    t.string "currency"
    t.index ["checked_in"], name: "index_purchased_items_on_checked_in"
    t.index ["purchase_id"], name: "index_purchased_items_on_purchase_id"
    t.index ["purchased_item_type", "purchased_item_id"], name: "index_purchased_items_on_purchased_item"
    t.index ["refund_id"], name: "index_purchased_items_on_refund_id"
    t.index ["state"], name: "index_purchased_items_on_state"
  end

  create_table "purchases", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "state"
    t.string "checkout_type"
    t.string "checkout_id"
    t.string "purchasable_type"
    t.bigint "purchasable_id"
    t.decimal "price"
    t.string "currency", default: "usd", null: false
    t.index ["checkout_type"], name: "index_purchases_on_checkout_type"
    t.index ["purchasable_type", "purchasable_id"], name: "index_purchases_on_purchasable_type_and_purchasable_id"
    t.index ["state"], name: "index_purchases_on_state"
    t.index ["user_id"], name: "index_purchases_on_user_id"
  end

  create_table "release_playlists", force: :cascade do |t|
    t.bigint "release_id", null: false
    t.bigint "playlist_id", null: false
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["playlist_id"], name: "index_release_playlists_on_playlist_id"
    t.index ["position"], name: "index_release_playlists_on_position"
    t.index ["release_id", "playlist_id"], name: "index_release_playlists_on_release_id_and_playlist_id", unique: true
    t.index ["release_id"], name: "index_release_playlists_on_release_id"
  end

  create_table "release_section_images", force: :cascade do |t|
    t.string "caption"
    t.integer "order"
    t.bigint "release_section_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["release_section_id"], name: "index_release_section_images_on_release_section_id"
  end

  create_table "release_sections", force: :cascade do |t|
    t.string "title"
    t.text "body"
    t.jsonb "data"
    t.bigint "release_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "position"
    t.index ["release_id"], name: "index_release_sections_on_release_id"
  end

  create_table "releases", force: :cascade do |t|
    t.bigint "playlist_id", null: false
    t.string "slug"
    t.string "title"
    t.jsonb "config"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "product_id"
    t.bigint "user_id"
    t.jsonb "editor_data"
    t.boolean "published"
    t.index ["playlist_id"], name: "index_releases_on_playlist_id"
    t.index ["product_id"], name: "index_releases_on_product_id"
    t.index ["user_id"], name: "index_releases_on_user_id"
  end

  create_table "reposts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "track_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["track_id"], name: "index_reposts_on_track_id"
    t.index ["user_id"], name: "index_reposts_on_user_id"
  end

  create_table "schedule_schedulings", force: :cascade do |t|
    t.bigint "event_schedule_id", null: false
    t.datetime "start_date"
    t.datetime "end_date"
    t.string "name"
    t.string "short_description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_schedule_id"], name: "index_schedule_schedulings_on_event_schedule_id"
  end

  create_table "service_bookings", force: :cascade do |t|
    t.bigint "service_product_id", null: false
    t.bigint "customer_id", null: false
    t.bigint "provider_id", null: false
    t.string "status", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "rating"
    t.text "feedback"
    t.index ["customer_id"], name: "index_service_bookings_on_customer_id"
    t.index ["provider_id"], name: "index_service_bookings_on_provider_id"
    t.index ["service_product_id"], name: "index_service_bookings_on_service_product_id"
    t.index ["status"], name: "index_service_bookings_on_status"
  end

  create_table "spotlights", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "spotlightable_type", null: false
    t.bigint "spotlightable_id", null: false
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["spotlightable_type", "spotlightable_id"], name: "index_spotlights_on_spotlightable"
    t.index ["user_id"], name: "index_spotlights_on_user_id"
  end

  create_table "terms_and_conditions", force: :cascade do |t|
    t.string "title"
    t.string "category"
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "tickets", force: :cascade do |t|
    t.string "title"
    t.decimal "price"
    t.decimal "early_bird_price"
    t.decimal "standard_price"
    t.integer "qty"
    t.datetime "selling_start"
    t.datetime "selling_end"
    t.string "short_description"
    t.jsonb "settings"
    t.bigint "event_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_tickets_on_event_id"
  end

  create_table "track_artists", force: :cascade do |t|
    t.bigint "track_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["track_id", "user_id"], name: "index_track_artists_on_track_id_and_user_id", unique: true
    t.index ["track_id"], name: "index_track_artists_on_track_id"
    t.index ["user_id"], name: "index_track_artists_on_user_id"
  end

  create_table "track_comments", force: :cascade do |t|
    t.bigint "track_id", null: false
    t.string "body"
    t.integer "track_minute"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["track_id"], name: "index_track_comments_on_track_id"
    t.index ["user_id"], name: "index_track_comments_on_user_id"
  end

  create_table "track_peaks", force: :cascade do |t|
    t.bigint "track_id", null: false
    t.jsonb "data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["track_id"], name: "index_track_peaks_on_track_id"
  end

  create_table "track_playlists", force: :cascade do |t|
    t.bigint "track_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "playlist_id", null: false
    t.integer "position"
    t.index ["playlist_id"], name: "index_track_playlists_on_playlist_id"
    t.index ["track_id"], name: "index_track_playlists_on_track_id"
  end

  create_table "tracks", force: :cascade do |t|
    t.string "title"
    t.boolean "private"
    t.string "slug"
    t.string "caption"
    t.bigint "user_id", null: false
    t.jsonb "notification_settings"
    t.jsonb "metadata"
    t.integer "likes_count"
    t.integer "reposts_count"
    t.string "state"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.string "genre"
    t.string "tags", default: [], array: true
    t.integer "label_id"
    t.boolean "podcast"
    t.index ["label_id"], name: "index_tracks_on_label_id"
    t.index ["slug"], name: "index_tracks_on_slug"
    t.index ["tags"], name: "index_tracks_on_tags", using: :gin
    t.index ["user_id"], name: "index_tracks_on_user_id"
  end

  create_table "user_links", force: :cascade do |t|
    t.string "title"
    t.string "url"
    t.integer "position"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "type"
    t.string "username"
    t.string "custom_url"
    t.index ["position"], name: "index_user_links_on_position"
    t.index ["type"], name: "index_user_links_on_type"
    t.index ["user_id"], name: "index_user_links_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.boolean "label"
    t.string "support_link"
    t.string "first_name"
    t.string "last_name"
    t.string "country"
    t.string "city"
    t.text "bio"
    t.jsonb "settings"
    t.string "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.jsonb "notification_settings"
    t.string "invitation_token"
    t.datetime "invitation_created_at"
    t.datetime "invitation_sent_at"
    t.datetime "invitation_accepted_at"
    t.integer "invitation_limit"
    t.string "invited_by_type"
    t.bigint "invited_by_id"
    t.integer "invitations_count", default: 0
    t.boolean "editor"
    t.boolean "seller"
    t.jsonb "social_links_settings", default: {}, null: false
    t.boolean "featured", default: false
    t.string "stripe_account_id"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["featured"], name: "index_users_on_featured"
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invited_by_id"], name: "index_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_users_on_invited_by"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["seller"], name: "index_users_on_seller"
    t.index ["social_links_settings"], name: "index_users_on_social_links_settings", using: :gin
    t.index ["stripe_account_id"], name: "index_users_on_stripe_account_id"
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  create_table "venue_rating_stats", force: :cascade do |t|
    t.bigint "venue_id", null: false
    t.date "bucket_on", null: false
    t.string "reviewer_role", null: false
    t.string "metric", null: false
    t.decimal "sum", precision: 10, scale: 2, default: "0.0", null: false
    t.integer "count", default: 0, null: false
    t.datetime "last_review_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["venue_id", "bucket_on", "reviewer_role", "metric"], name: "idx_venue_rating_stats_unique_bucket", unique: true
    t.index ["venue_id", "metric", "bucket_on"], name: "idx_venue_rating_stats_lookup"
    t.index ["venue_id"], name: "index_venue_rating_stats_on_venue_id"
  end

  create_table "venue_reviews", force: :cascade do |t|
    t.bigint "venue_id", null: false
    t.bigint "user_id", null: false
    t.string "reviewer_role", null: false
    t.decimal "overall_rating", precision: 2, scale: 1, null: false
    t.jsonb "aspects", default: {}, null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["aspects"], name: "index_venue_reviews_on_aspects", using: :gin
    t.index ["reviewer_role"], name: "index_venue_reviews_on_reviewer_role"
    t.index ["user_id"], name: "index_venue_reviews_on_user_id"
    t.index ["venue_id"], name: "index_venue_reviews_on_venue_id"
  end

  create_table "venues", force: :cascade do |t|
    t.string "name", null: false
    t.string "city"
    t.string "country"
    t.decimal "rating", precision: 3, scale: 2, default: "0.0", null: false
    t.integer "review_count", default: 0, null: false
    t.string "genres", array: true
    t.integer "capacity"
    t.string "price_range"
    t.text "description"
    t.string "address"
    t.decimal "lat", precision: 10, scale: 6
    t.decimal "lng", precision: 10, scale: 6
    t.string "slug"
    t.text "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["city"], name: "index_venues_on_city"
    t.index ["country"], name: "index_venues_on_country"
    t.index ["genres"], name: "index_venues_on_genres", using: :gin
    t.index ["slug"], name: "index_venues_on_slug", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "comments", "users"
  add_foreign_key "connected_accounts", "users"
  add_foreign_key "connected_accounts", "users", column: "parent_id"
  add_foreign_key "coupons", "users"
  add_foreign_key "course_documents", "courses"
  add_foreign_key "course_documents", "lessons"
  add_foreign_key "course_enrollments", "courses"
  add_foreign_key "course_enrollments", "users"
  add_foreign_key "course_modules", "courses"
  add_foreign_key "courses", "users"
  add_foreign_key "event_hosts", "events"
  add_foreign_key "event_hosts", "users"
  add_foreign_key "event_recordings", "events"
  add_foreign_key "event_schedules", "events"
  add_foreign_key "event_tickets", "events"
  add_foreign_key "events", "users"
  add_foreign_key "interest_alerts", "users"
  add_foreign_key "lessons", "course_modules"
  add_foreign_key "message_reads", "messages"
  add_foreign_key "message_reads", "participants"
  add_foreign_key "messages", "conversations"
  add_foreign_key "messages", "users"
  add_foreign_key "oauth_credentials", "users"
  add_foreign_key "participants", "conversations"
  add_foreign_key "participants", "users"
  add_foreign_key "photos", "users"
  add_foreign_key "plain_messages", "plain_conversations"
  add_foreign_key "playlists", "users"
  add_foreign_key "podcaster_hosts", "podcaster_infos"
  add_foreign_key "podcaster_hosts", "users"
  add_foreign_key "podcaster_infos", "users"
  add_foreign_key "posts", "categories"
  add_foreign_key "posts", "users"
  add_foreign_key "press_kits", "users"
  add_foreign_key "product_cart_items", "product_carts"
  add_foreign_key "product_cart_items", "products"
  add_foreign_key "product_carts", "users"
  add_foreign_key "product_images", "products"
  add_foreign_key "product_options", "products"
  add_foreign_key "product_purchase_items", "product_purchases"
  add_foreign_key "product_purchase_items", "products"
  add_foreign_key "product_purchases", "users"
  add_foreign_key "product_shippings", "products"
  add_foreign_key "product_variants", "products"
  add_foreign_key "products", "coupons"
  add_foreign_key "products", "playlists"
  add_foreign_key "products", "users"
  add_foreign_key "products_images", "products"
  add_foreign_key "purchased_items", "purchases"
  add_foreign_key "purchases", "users"
  add_foreign_key "release_playlists", "playlists"
  add_foreign_key "release_playlists", "releases"
  add_foreign_key "release_section_images", "release_sections"
  add_foreign_key "release_sections", "releases"
  add_foreign_key "releases", "playlists"
  add_foreign_key "releases", "products"
  add_foreign_key "releases", "users"
  add_foreign_key "reposts", "tracks"
  add_foreign_key "reposts", "users"
  add_foreign_key "schedule_schedulings", "event_schedules"
  add_foreign_key "service_bookings", "products", column: "service_product_id"
  add_foreign_key "service_bookings", "users", column: "customer_id"
  add_foreign_key "service_bookings", "users", column: "provider_id"
  add_foreign_key "spotlights", "users"
  add_foreign_key "tickets", "events"
  add_foreign_key "track_artists", "tracks"
  add_foreign_key "track_artists", "users"
  add_foreign_key "track_comments", "tracks"
  add_foreign_key "track_comments", "users"
  add_foreign_key "track_peaks", "tracks"
  add_foreign_key "track_playlists", "playlists"
  add_foreign_key "track_playlists", "tracks"
  add_foreign_key "tracks", "users"
  add_foreign_key "user_links", "users"
  add_foreign_key "venue_rating_stats", "venues"
  add_foreign_key "venue_reviews", "users"
  add_foreign_key "venue_reviews", "venues"
end
