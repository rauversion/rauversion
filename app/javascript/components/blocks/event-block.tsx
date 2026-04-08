"use client"

import React from "react"
import { CalendarDays, Clock3, MapPin, Ticket, Users } from "lucide-react"

import type { EventBlock as EventBlockType, PageStyle } from "@/lib/blocks/types"
import {
  fetchEventPurchaseOptions,
  type EventSiteRecord,
  type EventSiteSchedule,
  type EventSiteTicket,
} from "@/lib/event-sites"
import { cn } from "@/lib/utils"
import { getUserDisplayName } from "@/utils/userDisplayName"
import PurchaseDialog from "@/components/events/PurchaseDialog"
import { ArtistCard } from "@/components/events/ArtistCard"
import { useEventSite } from "@/components/events/event-site-context"
import I18n from "@/stores/locales"

interface EventBlockProps {
  block: EventBlockType
  pageStyle?: PageStyle
  isEditing?: boolean
}

function hexToRgb(color: string) {
  const value = color.trim().replace("#", "")
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : value

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null
  }

  const numericValue = Number.parseInt(normalized, 16)

  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  }
}

function rgba(color: string, alpha: number) {
  const rgb = hexToRgb(color)

  if (!rgb) return color

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function resolveDarkMode(themeMode: EventBlockType["props"]["themeMode"], pageStyle?: PageStyle) {
  if (themeMode === "light") return false
  if (themeMode === "dark") return true

  return pageStyle?.darkMode ?? true
}

function buildPalette(primaryColor: string, darkMode: boolean) {
  return darkMode
    ? {
        background: "#050816",
        text: "#f8fafc",
        muted: "rgba(226,232,240,0.72)",
        panel: "rgba(15,23,42,0.82)",
        panelStrong: "rgba(15,23,42,0.94)",
        border: "rgba(148,163,184,0.2)",
        accent: primaryColor,
        accentSoft: rgba(primaryColor, 0.14),
        accentBorder: rgba(primaryColor, 0.32),
        overlay: "linear-gradient(135deg, rgba(2,6,23,0.9), rgba(2,6,23,0.52))",
      }
    : {
        background: "#f8fafc",
        text: "#0f172a",
        muted: "rgba(51,65,85,0.78)",
        panel: "rgba(255,255,255,0.88)",
        panelStrong: "rgba(255,255,255,0.96)",
        border: "rgba(148,163,184,0.28)",
        accent: primaryColor,
        accentSoft: rgba(primaryColor, 0.08),
        accentBorder: rgba(primaryColor, 0.22),
        overlay: "linear-gradient(135deg, rgba(248,250,252,0.86), rgba(248,250,252,0.44))",
      }
}

function currentLocale() {
  return I18n.locale?.startsWith("es") ? "es-CL" : "en-US"
}

function formatTicketPrice(ticket: EventSiteTicket, currency?: string) {
  if (ticket.formatted_price) return ticket.formatted_price
  if (ticket.pay_what_you_want) {
    return ticket.minimum_price ? `Desde ${ticket.minimum_price}` : "Precio libre"
  }

  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: "currency",
      currency: (currency || "CLP").toUpperCase(),
      currencyDisplay: "code",
      minimumFractionDigits: Number.isInteger(ticket.price) ? 0 : 2,
      maximumFractionDigits: Number.isInteger(ticket.price) ? 0 : 2,
    }).format(ticket.price || 0)
  } catch {
    return `${currency || "CLP"} ${ticket.price || 0}`
  }
}

function authorAvatar(author?: EventSiteRecord["author"] | null) {
  if (!author) return null
  if (typeof author.avatar_url === "string") return author.avatar_url

  return author.avatar_url?.medium || author.avatar_url?.small || author.avatar_url?.large || null
}

function coverUrl(eventSite: EventSiteRecord) {
  return eventSite.cover_url?.large || eventSite.cover_url?.medium || eventSite.cover_url?.small || ""
}

function visibleHosts(eventSite: EventSiteRecord) {
  return eventSite.event_hosts.filter((host) => host.listed_on_page !== false)
}

function formatLocation(eventSite: EventSiteRecord) {
  return [eventSite.venue, eventSite.location || eventSite.city].filter(Boolean).join(" · ")
}

function ScheduleList({
  schedules,
  palette,
}: {
  schedules: EventSiteSchedule[]
  palette: ReturnType<typeof buildPalette>
}) {
  if (schedules.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {schedules.map((schedule) => (
        <article
          key={schedule.id}
          className="rounded-[24px] border p-5 backdrop-blur"
          style={{
            background: palette.panel,
            borderColor: palette.border,
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em]" style={{ color: palette.muted }}>
            <Clock3 className="h-3.5 w-3.5" />
            <span>{schedule.start_date_formatted || schedule.end_date_formatted || "Agenda"}</span>
          </div>
          <h3 className="text-xl font-semibold" style={{ color: palette.text }}>
            {schedule.name}
          </h3>
          {schedule.description ? (
            <p className="mt-2 text-sm leading-6" style={{ color: palette.muted }}>
              {schedule.description}
            </p>
          ) : null}
          {schedule.schedulings.length > 0 ? (
            <div className="mt-4 space-y-3">
              {schedule.schedulings.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    background: palette.accentSoft,
                    borderColor: palette.accentBorder,
                  }}
                >
                  <div className="text-xs uppercase tracking-[0.22em]" style={{ color: palette.muted }}>
                    {entry.start_date_formatted || entry.end_date_formatted || "Bloque"}
                  </div>
                  <div className="mt-1 font-medium" style={{ color: palette.text }}>
                    {entry.name}
                  </div>
                  {entry.short_description ? (
                    <div className="mt-1 text-sm" style={{ color: palette.muted }}>
                      {entry.short_description}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function TicketPanel({
  eventSite,
  tickets,
  loading,
  palette,
  buttonText,
  onOpen,
}: {
  eventSite: EventSiteRecord
  tickets: EventSiteTicket[]
  loading: boolean
  palette: ReturnType<typeof buildPalette>
  buttonText: string
  onOpen: () => void
}) {
  return (
    <aside
      className="rounded-[28px] border p-5 md:p-6"
      style={{
        background: palette.panelStrong,
        borderColor: palette.border,
        boxShadow: `0 25px 70px ${rgba(palette.accent, 0.18)}`,
      }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em]" style={{ color: palette.muted }}>
        <Ticket className="h-4 w-4" />
        <span>Entradas</span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold" style={{ color: palette.text }}>
        {buttonText}
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: palette.muted }}>
        Compra tickets para {eventSite.title} directamente desde Rauversion.
      </p>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl border"
              style={{ background: palette.accentSoft, borderColor: palette.accentBorder }}
            />
          ))
        ) : tickets.length > 0 ? (
          tickets.slice(0, 4).map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={onOpen}
              className="w-full rounded-2xl border px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
              style={{
                background: palette.accentSoft,
                borderColor: palette.accentBorder,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold" style={{ color: palette.text }}>
                    {ticket.title}
                  </div>
                  {ticket.short_description ? (
                    <div className="mt-1 text-sm leading-5" style={{ color: palette.muted }}>
                      {ticket.short_description}
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold" style={{ color: palette.text }}>
                    {formatTicketPrice(ticket, eventSite.ticket_currency)}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.24em]" style={{ color: palette.muted }}>
                    {ticket.sold_out ? "Agotado" : "Disponible"}
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div
            className="rounded-2xl border px-4 py-5 text-sm"
            style={{ background: palette.accentSoft, borderColor: palette.accentBorder, color: palette.muted }}
          >
            No hay tickets visibles por ahora.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{ background: palette.accent }}
      >
        {buttonText}
      </button>
    </aside>
  )
}

export function EventBlock({
  block,
  pageStyle,
  isEditing = false,
}: EventBlockProps) {
  const eventSite = useEventSite()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [tickets, setTickets] = React.useState<EventSiteTicket[]>([])
  const [loadingTickets, setLoadingTickets] = React.useState(false)
  const search = typeof window === "undefined" ? "" : window.location.search
  const ticketToken = React.useMemo(
    () => new URLSearchParams(search).get("ticket_token") || undefined,
    [search]
  )

  React.useEffect(() => {
    if (!ticketToken || isEditing) return

    setDialogOpen(true)
  }, [ticketToken, isEditing])

  React.useEffect(() => {
    if (!eventSite?.slug) {
      setTickets([])
      setLoadingTickets(false)
      return
    }

    let cancelled = false

    const loadTickets = async () => {
      setLoadingTickets(true)

      try {
        const availableTickets = await fetchEventPurchaseOptions(eventSite.slug)

        if (!cancelled) {
          setTickets(availableTickets)
        }
      } catch (error) {
        if (!cancelled) {
          setTickets([])
        }
      } finally {
        if (!cancelled) {
          setLoadingTickets(false)
        }
      }
    }

    loadTickets()

    return () => {
      cancelled = true
    }
  }, [eventSite?.slug])

  if (!eventSite?.id) {
    return (
      <div className="rounded-[28px] border border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-sm text-muted-foreground">
        {isEditing
          ? "Este bloque usa el evento actual. Estará disponible en el editor de sitios de evento."
          : "No se pudo cargar el evento para este bloque."}
      </div>
    )
  }

  const darkMode = resolveDarkMode(block.props.themeMode, pageStyle)
  const palette = buildPalette(pageStyle?.primaryColor || "#6366f1", darkMode)
  const heroCover = coverUrl(eventSite)
  const hosts = visibleHosts(eventSite)
  const locationLabel = formatLocation(eventSite)
  const authorName = eventSite.author ? getUserDisplayName(eventSite.author) : ""
  const authorImage = authorAvatar(eventSite.author)

  const heroText = (
    <div className="relative z-10 flex flex-col gap-6">
      {block.props.showMeta ? (
        <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: palette.muted }}>
          {authorName ? (
            <div className="inline-flex items-center gap-3 rounded-full border px-3 py-2" style={{ borderColor: palette.border }}>
              {authorImage ? (
                <img src={authorImage} alt={authorName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full" style={{ background: palette.accentSoft }} />
              )}
              <span>{authorName}</span>
            </div>
          ) : null}
          {eventSite.event_dates_formatted ? (
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: palette.border }}>
              <CalendarDays className="h-4 w-4" />
              <span>{eventSite.event_dates_formatted}</span>
            </div>
          ) : null}
          {eventSite.timezone ? (
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: palette.border }}>
              <Clock3 className="h-4 w-4" />
              <span>{eventSite.timezone}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl" style={{ color: palette.text }}>
          {eventSite.title}
        </h2>
        {block.props.showDescription && eventSite.description ? (
          <p className="max-w-3xl whitespace-pre-line text-base leading-7 md:text-lg" style={{ color: palette.muted }}>
            {eventSite.description}
          </p>
        ) : null}
      </div>

      {locationLabel ? (
        <div className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm" style={{ borderColor: palette.border, color: palette.text }}>
          <MapPin className="h-4 w-4" style={{ color: palette.accent }} />
          <span>{locationLabel}</span>
        </div>
      ) : null}
    </div>
  )

  const ticketPanel = block.props.showTicketPanel ? (
    <TicketPanel
      eventSite={eventSite}
      tickets={tickets}
      loading={loadingTickets}
      palette={palette}
      buttonText={block.props.ticketButtonText}
      onOpen={() => {
        if (!isEditing) {
          setDialogOpen(true)
        }
      }}
    />
  ) : null

  return (
    <>
      <section
        className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden"
        style={{
          background:
            block.props.variant === "minimal"
              ? palette.background
              : heroCover
                ? `${palette.overlay}, url(${heroCover}) center/cover`
                : palette.background,
          color: palette.text,
        }}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16",
            block.props.variant === "minimal" && "py-8 lg:py-10"
          )}
        >
          {block.props.variant === "poster" && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
              {heroText}
              {ticketPanel}
            </div>
          )}

          {block.props.variant === "editorial" && (
            <div className="grid gap-8 lg:grid-cols-[minmax(320px,480px)_minmax(0,1fr)] lg:items-center">
              <div className="overflow-hidden rounded-[32px] border" style={{ borderColor: palette.border }}>
                {heroCover ? (
                  <img src={heroCover} alt={eventSite.title} className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/5]" style={{ background: palette.accentSoft }} />
                )}
              </div>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                {heroText}
                {ticketPanel}
              </div>
            </div>
          )}

          {block.props.variant === "immersive" && (
            <div className="rounded-[36px] border p-6 backdrop-blur md:p-8" style={{ background: palette.panel, borderColor: palette.border }}>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
                {heroText}
                {ticketPanel}
              </div>
            </div>
          )}

          {block.props.variant === "minimal" && (
            <div className="grid gap-6 rounded-[32px] border p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_320px]" style={{ background: palette.panel, borderColor: palette.border }}>
              {heroText}
              {ticketPanel}
            </div>
          )}

          {block.props.showHosts && hosts.length > 0 ? (
            <div className="mt-10">
              <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.24em]" style={{ color: palette.muted }}>
                <Users className="h-4 w-4" />
                <span>Invitados</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {hosts.map((host) => (
                  <ArtistCard key={host.id} artist={host} />
                ))}
              </div>
            </div>
          ) : null}

          {block.props.showSchedule && eventSite.event_schedules.length > 0 ? (
            <div className="mt-10">
              <div className="mb-5 flex items-center gap-2 text-sm uppercase tracking-[0.24em]" style={{ color: palette.muted }}>
                <CalendarDays className="h-4 w-4" />
                <span>Agenda</span>
              </div>
              <ScheduleList schedules={eventSite.event_schedules} palette={palette} />
            </div>
          ) : null}
        </div>
      </section>

      <PurchaseDialog
        open={isEditing ? false : dialogOpen}
        onOpenChange={(open) => {
          if (!isEditing) {
            setDialogOpen(open)
          }
        }}
        eventId={eventSite.slug}
        ticketToken={ticketToken}
      />
    </>
  )
}
