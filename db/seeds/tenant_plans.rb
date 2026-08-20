plans = [
  {
    code: "artist",
    name: "Artist",
    description: "Un espacio independiente para un proyecto artístico.",
    position: 10,
    amount_cents: ENV.fetch("TENANT_ARTIST_PRICE_CENTS", "1500").to_i,
    provider_price_id: ENV["STRIPE_TENANT_ARTIST_MONTHLY_PRICE_ID"],
    entitlements: { tenant_access: true, custom_branding: true, custom_domain: false, advanced_analytics: false, max_members: 3, max_artists: 2, max_tracks: 100, storage_gb: 5, platform_fee_percent: 10 }
  },
  {
    code: "label",
    name: "Label",
    description: "Catálogo, equipo y herramientas para sellos en crecimiento.",
    position: 20,
    amount_cents: ENV.fetch("TENANT_LABEL_PRICE_CENTS", "4900").to_i,
    provider_price_id: ENV["STRIPE_TENANT_LABEL_MONTHLY_PRICE_ID"],
    entitlements: { tenant_access: true, custom_branding: true, custom_domain: true, advanced_analytics: true, max_members: 15, max_artists: 20, max_tracks: 2000, storage_gb: 100, platform_fee_percent: 5 }
  },
  {
    code: "network",
    name: "Network",
    description: "Operación ampliada para catálogos y comunidades de mayor escala.",
    position: 30,
    amount_cents: ENV.fetch("TENANT_NETWORK_PRICE_CENTS", "14900").to_i,
    provider_price_id: ENV["STRIPE_TENANT_NETWORK_MONTHLY_PRICE_ID"],
    entitlements: { tenant_access: true, custom_branding: true, custom_domain: true, advanced_analytics: true, max_members: 50, max_artists: 100, max_tracks: nil, storage_gb: 500, platform_fee_percent: 2 }
  }
]

plans.each do |attributes|
  plan = Plan.find_or_initialize_by(code: attributes.fetch(:code))
  plan.update!(attributes.except(:amount_cents, :provider_price_id))

  price = plan.plan_prices.find_or_initialize_by(provider: "stripe", currency: "usd", billing_interval: "month")
  price.update!(
    amount_cents: attributes.fetch(:amount_cents),
    provider_price_id: attributes[:provider_price_id],
    active: true
  )
end
