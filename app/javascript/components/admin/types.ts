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
  kind: "navigate" | "link" | "delete" | "custom"
  to?: string
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
