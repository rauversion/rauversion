"use client"

import React from "react"
import { Ticket, CalendarDays } from "lucide-react"

import type { EventTicketsBlock as EventTicketsBlockType, PageStyle } from "@/lib/blocks/types"
import { fetchEventPurchaseData, type EventPurchaseData, type EventSiteTicket } from "@/lib/event-sites"
import { cn } from "@/lib/utils"
import PurchaseDialog from "@/components/events/PurchaseDialog"

interface EventTicketsBlockProps {
  block: EventTicketsBlockType
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

function resolveDarkMode(themeMode: EventTicketsBlockType["props"]["themeMode"], pageStyle?: PageStyle) {
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
        panel: "rgba(15,23,42,0.88)",
        panelStrong: "rgba(15,23,42,0.96)",
        border: "rgba(148,163,184,0.2)",
        accent: primaryColor,
        accentSoft: rgba(primaryColor, 0.14),
        accentBorder: rgba(primaryColor, 0.32),
      }
    : {
        background: "#f8fafc",
        text: "#0f172a",
        muted: "rgba(51,65,85,0.78)",
        panel: "rgba(255,255,255,0.9)",
        panelStrong: "rgba(255,255,255,0.96)",
        border: "rgba(148,163,184,0.28)",
        accent: primaryColor,
        accentSoft: rgba(primaryColor, 0.08),
        accentBorder: rgba(primaryColor, 0.22),
      }
}

function formatTicketPrice(ticket: EventSiteTicket, currency?: string) {
  if (ticket.formatted_price) return ticket.formatted_price
  if (ticket.pay_what_you_want) {
    return ticket.minimum_price ? `Desde ${ticket.minimum_price}` : "Precio libre"
  }

  try {
    return new Intl.NumberFormat("es-CL", {
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

function TicketSkeleton({ palette }: { palette: ReturnType<typeof buildPalette> }) {
  return (
    <div
      className="h-36 animate-pulse rounded-[24px] border"
      style={{ background: palette.accentSoft, borderColor: palette.accentBorder }}
    />
  )
}

export function EventTicketsBlock({
  block,
  pageStyle,
  isEditing = false,
}: EventTicketsBlockProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [purchaseData, setPurchaseData] = React.useState<EventPurchaseData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const eventIdentifier = block.props.eventId?.trim()

  React.useEffect(() => {
    if (!eventIdentifier) {
      setPurchaseData(null)
      setLoading(false)
      setHasError(false)
      return
    }

    let cancelled = false

    const loadPurchaseData = async () => {
      setLoading(true)
      setHasError(false)

      try {
        const nextPurchaseData = await fetchEventPurchaseData(eventIdentifier)

        if (!cancelled) {
          setPurchaseData(nextPurchaseData)
        }
      } catch (_error) {
        if (!cancelled) {
          setPurchaseData(null)
          setHasError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPurchaseData()

    return () => {
      cancelled = true
    }
  }, [eventIdentifier])

  const darkMode = resolveDarkMode(block.props.themeMode, pageStyle)
  const palette = buildPalette(pageStyle?.primaryColor || "#6366f1", darkMode)
  const event = purchaseData?.event || null
  const tickets = purchaseData?.tickets || []
  const showRemaining = event?.show_remaining_tickets === true

  if (!eventIdentifier) {
    return (
      <div className="rounded-[28px] border border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-sm text-muted-foreground">
        Selecciona un evento para mostrar sus tickets.
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="rounded-[28px] border border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-sm text-muted-foreground">
        No se pudieron cargar los tickets de este evento.
      </div>
    )
  }

  return (
    <>
      <section
        className="rounded-[32px] border p-5 md:p-6"
        style={{
          background: palette.panelStrong,
          borderColor: palette.border,
          boxShadow: `0 25px 70px ${rgba(palette.accent, 0.12)}`,
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em]" style={{ color: palette.muted }}>
              <Ticket className="h-4 w-4" />
              <span>Tickets</span>
            </div>
            {block.props.showEventTitle && event?.title ? (
              <h3 className="mt-3 text-2xl font-semibold md:text-3xl" style={{ color: palette.text }}>
                {event.title}
              </h3>
            ) : null}
          </div>
          {!loading && tickets.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (!isEditing) {
                  setDialogOpen(true)
                }
              }}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white md:inline-flex"
              style={{ background: palette.accent }}
            >
              {block.props.buttonText}
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className={cn("grid gap-4", block.props.variant === "cards" ? "md:grid-cols-2" : "grid-cols-1")}>
            {Array.from({ length: block.props.variant === "cards" ? 4 : 3 }).map((_, index) => (
              <TicketSkeleton key={index} palette={palette} />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className={cn("grid gap-4", block.props.variant === "cards" ? "md:grid-cols-2" : "grid-cols-1")}>
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                disabled={ticket.sold_out || isEditing}
                onClick={() => {
                  if (!isEditing && !ticket.sold_out) {
                    setDialogOpen(true)
                  }
                }}
                className={cn(
                  "group rounded-[24px] border p-5 text-left transition-transform",
                  !ticket.sold_out && !isEditing && "hover:-translate-y-0.5",
                  ticket.sold_out && "cursor-not-allowed opacity-70"
                )}
                style={{
                  background: palette.panel,
                  borderColor: ticket.sold_out ? palette.border : palette.accentBorder,
                }}
              >
                <div className={cn("flex gap-4", block.props.variant === "list" ? "items-center justify-between" : "flex-col")}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-lg" style={{ color: palette.text }}>
                        {ticket.title}
                      </div>
                      {ticket.sold_out ? (
                        <span
                          className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
                          style={{ borderColor: palette.border, color: palette.muted }}
                        >
                          Agotado
                        </span>
                      ) : null}
                    </div>
                    {ticket.short_description ? (
                      <p className="mt-2 text-sm leading-6" style={{ color: palette.muted }}>
                        {ticket.short_description}
                      </p>
                    ) : null}
                  </div>

                  <div className={cn("shrink-0", block.props.variant === "list" ? "text-right" : "space-y-3")}>
                    <div className="text-xl font-semibold" style={{ color: palette.text }}>
                      {formatTicketPrice(ticket, event?.ticket_currency)}
                    </div>
                    {showRemaining && typeof ticket.quantity === "number" ? (
                      <div className="flex items-center gap-2 text-xs" style={{ color: palette.muted }}>
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{ticket.quantity} disponibles</span>
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                        ticket.sold_out ? "border" : ""
                      )}
                      style={{
                        background: ticket.sold_out ? "transparent" : palette.accentSoft,
                        borderColor: palette.border,
                        color: ticket.sold_out ? palette.muted : palette.accent,
                      }}
                    >
                      {ticket.sold_out ? "No disponible" : block.props.buttonText}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="rounded-[24px] border px-4 py-5 text-sm"
            style={{ background: palette.accentSoft, borderColor: palette.accentBorder, color: palette.muted }}
          >
            No hay tickets visibles para este evento.
          </div>
        )}
      </section>

      <PurchaseDialog
        open={isEditing ? false : dialogOpen}
        onOpenChange={(open) => {
          if (!isEditing) {
            setDialogOpen(open)
          }
        }}
        eventId={eventIdentifier}
      />
    </>
  )
}
