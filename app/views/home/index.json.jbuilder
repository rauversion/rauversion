json.appName ENV["APP_NAME"]
json.displayHero ENV["DISPLAY_HERO"]
json.tenant do
  json.id Current.tenant.id
  json.name Current.tenant.name
  json.slug Current.tenant.slug
  json.central Current.tenant.central?
  json.logo_url Current.tenant.logo.attached? ? url_for(Current.tenant.logo) : nil
  json.settings do
    json.tagline Current.tenant.tagline
    json.template Current.tenant.template
    json.theme_schema Current.tenant.theme_schema
  end
end
