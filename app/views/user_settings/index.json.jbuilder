json.user do
  json.id @user.id
  json.username @user.username
  json.hide_username_from_profile @user.hide_username_from_profile
  json.first_name @user.first_name
  json.last_name @user.last_name
  json.bio @user.bio
  json.country @user.country
  json.city @user.city
  json.email @user.email
  json.avatar_url do
    json.small @user.avatar_url(:small)
    json.medium @user.avatar_url(:medium)
    json.large @user.avatar_url(:large)
  end
  json.profile_header_url do
    json.small @user.profile_header_url(:small)
    json.medium @user.profile_header_url(:medium)
    json.large @user.profile_header_url(:large)
  end

  json.social_links_settings do
    # Social Links & SEO Settings
    json.social_title @user.social_title
    json.social_description @user.social_description
    json.google_analytics_id @user.google_analytics_id
    json.facebook_pixel_id @user.facebook_pixel_id
    json.email_sign_up @user.email_sign_up
    json.sensitive_content @user.sensitive_content
    json.age_restriction @user.age_restriction
  end

  # Notification settings
  json.new_follower_email @user.new_follower_email
  json.new_follower_app @user.new_follower_app
  json.repost_of_your_post_email @user.repost_of_your_post_email
  json.repost_of_your_post_app @user.repost_of_your_post_app
  json.new_post_by_followed_user_email @user.new_post_by_followed_user_email
  json.new_post_by_followed_user_app @user.new_post_by_followed_user_app
  json.like_and_plays_on_your_post_app @user.like_and_plays_on_your_post_app
  json.comment_on_your_post_email @user.comment_on_your_post_email
  json.comment_on_your_post_app @user.comment_on_your_post_app
  json.suggested_content_email @user.suggested_content_email
  json.suggested_content_app @user.suggested_content_app
  json.new_message_email @user.new_message_email
  json.new_message_app @user.new_message_app
  json.like_and_plays_on_your_post_email @user.like_and_plays_on_your_post_email

  # Podcaster info
  json.podcaster_info do
    json.id @user.podcaster_info&.id
    json.active @user.podcaster_info&.active
    json.title @user.podcaster_info&.title
    json.about @user.podcaster_info&.about
    json.description @user.podcaster_info&.description
    json.avatar_url do
      json.small @user.podcaster_info&.avatar_url(:small)
      json.medium @user.podcaster_info&.avatar_url(:medium)
      json.large @user.podcaster_info&.avatar_url(:large)
    end
    json.has_podcast_links @user.podcaster_info&.has_podcast_links?

    json.podcast_links do
      json.spotify_url @user.podcaster_info&.spotify_url
      json.apple_podcasts_url @user.podcaster_info&.apple_podcasts_url
      json.google_podcasts_url @user.podcaster_info&.google_podcasts_url
      json.stitcher_url @user.podcaster_info&.stitcher_url
      json.overcast_url @user.podcaster_info&.overcast_url
      json.pocket_casts_url @user.podcaster_info&.pocket_casts_url
    end
  end
end

json.section @section

json.menu_items [
  {
    to: "/settings",
    namespace: "profile",
    title: I18n.t("user_settings.title_account"),
    sub: I18n.t("user_settings.sub_account")
  },
  {
    to: "/settings/email",
    namespace: "email",
    title: I18n.t("user_settings.title_email"),
    sub: I18n.t("user_settings.sub_email")
  },
  {
    to: "/settings/podcast",
    namespace: "podcast",
    title: I18n.t("user_settings.podcaster_info"),
    sub: I18n.t("user_settings.sub_podcasts")
  },
  {
    to: "/settings/security",
    namespace: "security",
    title: I18n.t("user_settings.title_security"),
    sub: I18n.t("user_settings.sub_credentials")
  },
  {
    to: "/settings/notifications",
    namespace: "notifications",
    title: I18n.t("user_settings.title_notifications"),
    sub: I18n.t("user_settings.sub_notifications")
  },
  {
    to: "/settings/social_links",
    namespace: "social_links",
    title: I18n.t("user_settings.title_social_links"),
    sub: I18n.t("user_settings.sub_social_links")
  },
  {
    to: "/settings/integrations",
    namespace: "integrations",
    title: I18n.t("user_settings.title_integrations"),
    sub: I18n.t("user_settings.sub_integrations")
  },
  {
    to: "/settings/transbank",
    namespace: "transbank",
    title: I18n.t("user_settings.title_transbank"),
    sub: I18n.t("user_settings.sub_transbank")
  },
  {
    to: "/settings/invitations",
    namespace: "invitations",
    title: I18n.t("user_settings.title_invitations"),
    sub: I18n.t("user_settings.sub_invitations")
  }
]
