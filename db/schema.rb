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

ActiveRecord::Schema[8.0].define(version: 2025_02_09_172718) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", precision: nil, null: false
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
  end

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.string "slug"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "comments", force: :cascade do |t|
    t.string "commentable_type", null: false
    t.bigint "commentable_id", null: false
    t.bigint "user_id", null: false
    t.text "body"
    t.integer "parent_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
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

  create_table "event_hosts", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.bigint "event_id", null: false
    t.bigint "user_id", null: false
    t.boolean "listed_on_page"
    t.boolean "event_manager"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "event_recordings", force: :cascade do |t|
    t.string "type"
    t.string "title"
    t.text "description"
    t.text "iframe"
    t.jsonb "properties"
    t.integer "position"
    t.bigint "event_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "event_schedules", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.datetime "start_date", precision: nil
    t.datetime "end_date", precision: nil
    t.string "schedule_type"
    t.string "name"
    t.string "description"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "event_tickets", force: :cascade do |t|
    t.string "title"
    t.decimal "price"
    t.decimal "early_bird_price"
    t.decimal "standard_price"
    t.integer "qty"
    t.datetime "selling_start", precision: nil
    t.datetime "selling_end", precision: nil
    t.string "short_description"
    t.jsonb "settings"
    t.bigint "event_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "events", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.string "slug"
    t.string "state"
    t.string "timezone"
    t.datetime "event_start", precision: nil
    t.datetime "event_ends", precision: nil
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
    t.jsonb "streaming_service"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "follows", force: :cascade do |t|
    t.string "follower_type"
    t.integer "follower_id"
    t.string "followable_type"
    t.integer "followable_id"
    t.datetime "created_at", precision: nil
  end

  create_table "friendly_id_slugs", force: :cascade do |t|
    t.string "slug", null: false
    t.integer "sluggable_id", null: false
    t.string "sluggable_type", limit: 50
    t.string "scope"
    t.datetime "created_at", precision: nil
  end

  create_table "likes", force: :cascade do |t|
    t.string "liker_type"
    t.integer "liker_id"
    t.string "likeable_type"
    t.integer "likeable_id"
    t.datetime "created_at", precision: nil
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
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "mentions", force: :cascade do |t|
    t.string "mentioner_type"
    t.integer "mentioner_id"
    t.string "mentionable_type"
    t.integer "mentionable_id"
    t.datetime "created_at", precision: nil
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
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end
