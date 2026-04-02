export type AdminNavItem = {
  key: string
  label: string
  kind: "dashboard" | "resource"
  icon?: string
  path: string
  creatable?: boolean
}

export type AdminColumn = {
  key: string
  label: string
  type: string
}

export type AdminFieldOption = {
  label: string
  value: string | number | boolean
}

export type AdminFormField = {
  key: string
  label: string
  type: string
  readonly?: boolean
  required?: boolean
  section?: string
  description?: string
  options?: AdminFieldOption[]
}

export type AdminResourceDefinition = {
  key: string
  label: string
  icon?: string
  description?: string
  creatable: boolean
  editable: boolean
  destroyable: boolean
  columns: AdminColumn[]
  form_fields: AdminFormField[]
  scopes: Array<{ key: string; label: string }>
}

export type AdminAction = {
  key: string
  label: string
  kind: "navigate" | "link" | "href" | "delete" | "custom"
  to?: string
  href?: string
  endpoint?: string
}

export type AdminRecord = {
  id: number | string
  values: Record<string, any>
  form_values?: Record<string, any>
  actions: AdminAction[]
  metadata?: {
    created_at?: string
    updated_at?: string
  }
}

export type AdminListResponse = {
  resource: AdminResourceDefinition
  records: AdminRecord[]
  pagination: {
    current_page: number
    total_pages: number
    total_count: number
    per_page: number
  }
  scope: string
  query: string
}

export type AdminRecordResponse = {
  resource: AdminResourceDefinition
  record: AdminRecord
}

export type AdminMetaResponse = {
  navigation: AdminNavItem[]
}

export type CommerceDashboardData = {
  summary: {
    paid_orders: number
    items_sold: number
    products_sold: number
    active_sellers: number
    latest_sale_at?: string | null
  }
  paid_revenue_by_currency: Array<{ currency: string; amount: number }>
  item_revenue_by_currency: Array<{ currency: string; amount: number }>
  refunded_revenue_by_currency: Array<{ currency: string; amount: number }>
  top_products: Array<{
    id: number
    title: string
    category: string
    product_type: string
    currency: string
    units_sold: number
    revenue: number
    seller_name: string
    seller_username?: string
    seller_path?: string
    product_path?: string
    archived?: boolean
  }>
  top_sellers: Array<{
    id: number
    name: string
    username?: string
    currency: string
    orders_count: number
    products_count: number
    units_sold: number
    revenue: number
    seller_path?: string
  }>
  top_categories: Array<{
    category: string
    currency: string
    orders_count: number
    units_sold: number
    revenue: number
  }>
  recent_items: Array<{
    id: number
    purchase_id: number
    title: string
    category: string
    quantity: number
    unit_price: number
    item_revenue: number
    currency: string
    sold_at?: string
    purchase_status?: string
    shipping_status?: string
    seller_name: string
    seller_username?: string
    seller_path?: string
    buyer_name?: string
    buyer_username?: string
    buyer_email?: string
    buyer_path?: string
    product_path?: string
    archived?: boolean
  }>
}

export type ListeningDashboardData = {
  range: {
    from: string
    to: string
    days: number
  }
  summary: {
    total_plays: number
    accounts_count: number
    tracks_count: number
    playlists_count: number
    countries_count: number
    latest_play_at?: string | null
  }
  plays_series: Array<{
    date: string
    label: string
    plays_count: number
  }>
  top_tracks: Array<{
    id: number
    title: string
    artist_name: string
    artist_username?: string
    artist_path?: string
    plays_count: number
    track_path?: string
    private?: boolean
    missing?: boolean
  }>
  top_countries: Array<{
    country: string
    plays_count: number
    accounts_count: number
    flag_url?: string | null
  }>
  top_accounts: Array<{
    id: number
    name: string
    username?: string
    user_path?: string
    plays_count: number
    tracks_count: number
    playlists_count: number
    missing?: boolean
  }>
  top_playlists: Array<{
    id: number
    title: string
    playlist_type: string
    owner_name: string
    owner_username?: string
    owner_path?: string
    plays_count: number
    playlist_path?: string
    private?: boolean
    missing?: boolean
  }>
}

export type EventSalesDashboardData = {
  range: {
    from: string
    to: string
    days: number
  }
  summary: {
    sold_tickets: number
    remaining_tickets: number
    refunded_tickets: number
    events_with_sales: number
    latest_sale_at?: string | null
  }
  paid_revenue_by_currency: Array<{ currency: string; amount: number }>
  refunded_revenue_by_currency: Array<{ currency: string; amount: number }>
  top_events: Array<{
    id: number
    title: string
    state: string
    visibility: string
    event_start?: string | null
    sold_tickets: number
    remaining_tickets: number
    refunded_tickets: number
    currency: string
    revenue: number
    organizer_name: string
    organizer_username?: string
    organizer_path?: string
    event_path?: string
  }>
  top_ticket_types: Array<{
    id: number
    title: string
    sold_tickets: number
    remaining_tickets: number
    refunded_tickets: number
    currency: string
    revenue: number
    event_title: string
    archived?: boolean
    event_path?: string
  }>
}
