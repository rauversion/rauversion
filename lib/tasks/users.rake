namespace :users do
  desc "Backfill default notification settings for existing users without overriding explicit values"
  task backfill_notification_settings_defaults: :environment do
    defaults = {
      "new_follower_email" => true,
      "new_follower_app" => true,
      "repost_of_your_post_email" => true,
      "repost_of_your_post_app" => true,
      "like_and_plays_on_your_post_app" => true,
      "comment_on_your_post_email" => true,
      "comment_on_your_post_app" => true,
      "suggested_content_email" => true,
      "suggested_content_app" => true,
      "new_message_email" => true,
      "new_message_app" => true,
      "like_and_plays_on_your_post_email" => true
    }.freeze

    dry_run = ActiveModel::Type::Boolean.new.cast(ENV["DRY_RUN"])
    scanned_users = 0
    updated_users = 0
    defaults_applied = 0

    User.find_each do |user|
      scanned_users += 1
      notification_settings = (user.notification_settings || {}).deep_stringify_keys
      applied_in_user = 0

      defaults.each do |key, value|
        next unless notification_settings[key].nil?

        notification_settings[key] = value
        applied_in_user += 1
      end

      next if applied_in_user.zero?

      unless dry_run
        user.update_columns(notification_settings: notification_settings)
      end

      updated_users += 1
      defaults_applied += applied_in_user
    end

    mode = dry_run ? "DRY_RUN" : "APPLY"
    puts "[#{mode}] scanned_users=#{scanned_users} updated_users=#{updated_users} defaults_applied=#{defaults_applied}"
  end
end
