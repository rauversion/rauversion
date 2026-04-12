import { get, put } from "@rails/request.js"
import type { Page } from "@/lib/blocks/types"

export type EventSiteMode = "default" | "custom"

export interface EventImageUrls {
  small?: string
  medium?: string
  large?: string
}

export interface EventSiteAuthor {
  id?: number | string
  username?: string
  display_name?: string
  full_name?: string
  name?: string
  avatar_url?: EventImageUrls | string
}

export interface EventSiteHost {
  id: number | string
  name: string
  description?: string
  listed_on_page?: boolean
  avatar_url?: EventImageUrls
  user?: EventSiteAuthor | null
}

export interface EventSiteNestedScheduling {
  id: number | string
  name: string
  start_date?: string
  end_date?: string
  start_date_formatted?: string
  end_date_formatted?: string
  short_description?: string
}

export interface EventSiteSchedule {
  id: number | string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  start_date_formatted?: string
  end_date_formatted?: string
  schedule_type?: string
  schedulings: EventSiteNestedScheduling[]
}

export interface EventSiteTicket {
  id: number | string
  title: string
  price: number
  formatted_price?: string
  short_description?: string
  quantity?: number
  sold_out?: boolean
  minimum_price?: number | null
  suggested_price?: number | null
  pay_what_you_want?: boolean
  min_tickets_per_order?: number
  max_tickets_per_order?: number
}

export interface EventPurchaseEvent {
  id: string
  title: string
  ticket_currency?: string
  show_remaining_tickets?: boolean
}

export interface EventPurchaseData {
  event: EventPurchaseEvent | null
  tickets: EventSiteTicket[]
}

export interface EventSiteRecord {
  id: string
  slug: string
  title: string
  description: string
  timezone?: string
  event_dates_formatted?: string
  venue?: string
  location?: string
  street?: string
  street_number?: string
  city?: string
  province?: string
  country?: string
  lat?: string
  lng?: string
  ticket_currency?: string
  cover_url?: EventImageUrls
  author?: EventSiteAuthor | null
  event_hosts: EventSiteHost[]
  event_schedules: EventSiteSchedule[]
  siteMode: EventSiteMode
  sitePages: Page[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return undefined
}

function normalizePages(value: unknown): Page[] {
  return Array.isArray(value) ? (value as Page[]) : []
}

function normalizeSiteMode(value: unknown): EventSiteMode {
  return value === "custom" ? "custom" : "default"
}

function normalizeImageUrls(value: unknown): EventImageUrls | undefined {
  if (!isRecord(value)) return undefined

  return {
    small: typeof value.small === "string" ? value.small : undefined,
    medium: typeof value.medium === "string" ? value.medium : undefined,
    large: typeof value.large === "string" ? value.large : undefined,
  }
}

function normalizeAuthor(value: unknown): EventSiteAuthor | null {
  if (!isRecord(value)) return null

  return {
    id:
      typeof value.id === "number" || typeof value.id === "string"
        ? value.id
        : undefined,
    username: typeof value.username === "string" ? value.username : undefined,
    display_name: typeof value.display_name === "string" ? value.display_name : undefined,
    full_name: typeof value.full_name === "string" ? value.full_name : undefined,
    name: typeof value.name === "string" ? value.name : undefined,
    avatar_url:
      typeof value.avatar_url === "string"
        ? value.avatar_url
        : normalizeImageUrls(value.avatar_url),
  }
}

function normalizeHost(value: unknown): EventSiteHost | null {
  if (!isRecord(value)) return null

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : null
  const name = typeof value.name === "string" ? value.name : ""

  if (!id || !name) return null

  return {
    id,
    name,
    description: typeof value.description === "string" ? value.description : undefined,
    listed_on_page: value.listed_on_page === true,
    avatar_url: normalizeImageUrls(value.avatar_url),
    user: normalizeAuthor(value.user),
  }
}

function normalizeNestedScheduling(value: unknown): EventSiteNestedScheduling | null {
  if (!isRecord(value)) return null

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : null
  const name = typeof value.name === "string" ? value.name : ""

  if (!id || !name) return null

  return {
    id,
    name,
    start_date: typeof value.start_date === "string" ? value.start_date : undefined,
    end_date: typeof value.end_date === "string" ? value.end_date : undefined,
    start_date_formatted:
      typeof value.start_date_formatted === "string" ? value.start_date_formatted : undefined,
    end_date_formatted:
      typeof value.end_date_formatted === "string" ? value.end_date_formatted : undefined,
    short_description:
      typeof value.short_description === "string" ? value.short_description : undefined,
  }
}

function normalizeSchedule(value: unknown): EventSiteSchedule | null {
  if (!isRecord(value)) return null

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : null
  const name = typeof value.name === "string" ? value.name : ""

  if (!id || !name) return null

  return {
    id,
    name,
    description: typeof value.description === "string" ? value.description : undefined,
    start_date: typeof value.start_date === "string" ? value.start_date : undefined,
    end_date: typeof value.end_date === "string" ? value.end_date : undefined,
    start_date_formatted:
      typeof value.start_date_formatted === "string" ? value.start_date_formatted : undefined,
    end_date_formatted:
      typeof value.end_date_formatted === "string" ? value.end_date_formatted : undefined,
    schedule_type: typeof value.schedule_type === "string" ? value.schedule_type : undefined,
    schedulings: Array.isArray(value.schedulings)
      ? value.schedulings.map(normalizeNestedScheduling).filter(Boolean) as EventSiteNestedScheduling[]
      : [],
  }
}

function normalizeTicket(value: unknown): EventSiteTicket | null {
  if (!isRecord(value)) return null

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : null
  const title = typeof value.title === "string" ? value.title : ""
  const minimumPrice =
    typeof value.minimum_price === "number"
      ? value.minimum_price
      : value.minimum_price == null || value.minimum_price === ""
        ? null
        : Number(value.minimum_price)
  const suggestedPrice =
    typeof value.suggested_price === "number"
      ? value.suggested_price
      : value.suggested_price == null || value.suggested_price === ""
        ? null
        : Number(value.suggested_price)

  if (!id || !title) return null

  return {
    id,
    title,
    price: Number(value.price) || 0,
    formatted_price: typeof value.formatted_price === "string" ? value.formatted_price : undefined,
    short_description:
      typeof value.short_description === "string" ? value.short_description : undefined,
    quantity: typeof value.quantity === "number" ? value.quantity : Number(value.quantity) || undefined,
    sold_out: value.sold_out === true || value["sold_out?"] === true,
    minimum_price: minimumPrice === null ? null : Number.isFinite(minimumPrice) ? minimumPrice : undefined,
    suggested_price: suggestedPrice === null ? null : Number.isFinite(suggestedPrice) ? suggestedPrice : undefined,
    pay_what_you_want: value.pay_what_you_want === true,
    min_tickets_per_order:
      typeof value.min_tickets_per_order === "number"
        ? value.min_tickets_per_order
        : Number(value.min_tickets_per_order) || undefined,
    max_tickets_per_order:
      typeof value.max_tickets_per_order === "number"
        ? value.max_tickets_per_order
        : Number(value.max_tickets_per_order) || undefined,
  }
}

function normalizePurchaseEvent(value: unknown): EventPurchaseEvent | null {
  if (!isRecord(value)) return null

  const id =
    typeof value.id === "number" || typeof value.id === "string"
      ? String(value.id)
      : ""

  if (!id) return null

  return {
    id,
    title: typeof value.title === "string" ? value.title : "",
    ticket_currency:
      typeof value.ticket_currency === "string" ? value.ticket_currency : undefined,
    show_remaining_tickets:
      value.show_remaining_tickets === true,
  }
}

export function normalizeEventSiteRecord(payload: unknown): EventSiteRecord {
  const value = isRecord(payload) ? payload : {}
  const siteData = isRecord(value.site_data) ? value.site_data : {}

  return {
    id:
      typeof value.id === "number" || typeof value.id === "string"
        ? String(value.id)
        : "",
    slug: typeof value.slug === "string" ? value.slug : "",
    title: typeof value.title === "string" ? value.title : "",
    description: typeof value.description === "string" ? value.description : "",
    timezone: typeof value.timezone === "string" ? value.timezone : undefined,
    event_dates_formatted:
      typeof value.event_dates_formatted === "string" ? value.event_dates_formatted : undefined,
    venue: typeof value.venue === "string" ? value.venue : undefined,
    location: typeof value.location === "string" ? value.location : undefined,
    street: normalizeOptionalString(value.street),
    street_number: normalizeOptionalString(value.street_number),
    city: typeof value.city === "string" ? value.city : undefined,
    province: typeof value.province === "string" ? value.province : undefined,
    country: typeof value.country === "string" ? value.country : undefined,
    lat: normalizeOptionalString(value.lat),
    lng: normalizeOptionalString(value.lng),
    ticket_currency:
      typeof value.ticket_currency === "string" ? value.ticket_currency : undefined,
    cover_url: normalizeImageUrls(value.cover_url),
    author: normalizeAuthor(value.author),
    event_hosts: Array.isArray(value.event_hosts)
      ? value.event_hosts.map(normalizeHost).filter(Boolean) as EventSiteHost[]
      : [],
    event_schedules: Array.isArray(value.event_schedules)
      ? value.event_schedules.map(normalizeSchedule).filter(Boolean) as EventSiteSchedule[]
      : [],
    siteMode: normalizeSiteMode(value.site_mode ?? siteData.site_mode),
    sitePages: normalizePages(value.site_pages ?? siteData.site_pages),
  }
}

export async function fetchPublicEventSite(slug: string): Promise<EventSiteRecord> {
  const response = await get(`/events/${slug}.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo cargar el evento")
  }

  return normalizeEventSiteRecord(await response.json)
}

export async function fetchEditableEventSite(slug: string): Promise<EventSiteRecord> {
  const response = await get(`/events/${slug}/edit.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo cargar el editor del evento")
  }

  return normalizeEventSiteRecord(await response.json)
}

export async function saveEventSitePages(slug: string, pages: Page[]): Promise<void> {
  const response = await put(`/events/${slug}.json`, {
    body: JSON.stringify({
      event: {
        site_pages: pages,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo guardar el sitio del evento")
  }
}

export async function saveEventSiteMode(
  slug: string,
  siteMode: EventSiteMode
): Promise<EventSiteRecord> {
  const response = await put(`/events/${slug}.json`, {
    body: JSON.stringify({
      event: {
        site_mode: siteMode,
      },
    }),
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudo actualizar el modo del sitio")
  }

  const payload = await response.json
  const eventPayload = isRecord(payload) && isRecord(payload.event) ? payload.event : payload

  return normalizeEventSiteRecord(eventPayload)
}

export async function fetchEventPurchaseOptions(slug: string): Promise<EventSiteTicket[]> {
  const purchaseData = await fetchEventPurchaseData(slug)

  return purchaseData.tickets
}

export async function fetchEventPurchaseData(slug: string): Promise<EventPurchaseData> {
  const response = await get(`/events/${slug}/event_purchases/new.json`, {
    responseKind: "json",
  })

  if (!response.ok) {
    throw new Error("No se pudieron cargar los tickets del evento")
  }

  const payload = await response.json
  const tickets = isRecord(payload) && Array.isArray(payload.tickets) ? payload.tickets : []
  const event = isRecord(payload) ? normalizePurchaseEvent(payload.event) : null

  return {
    event,
    tickets: tickets.map(normalizeTicket).filter(Boolean) as EventSiteTicket[],
  }
}
