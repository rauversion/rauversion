import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Ticket } from "lucide-react"
import { formatDistance } from "date-fns"
import { Button } from "@/components/ui/button"
import EventTicketModal from "../event_tickets/EventTicketModal"
import I18n from "@/stores/locales"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

function t(key, options = {}) {
  return I18n.t(`purchases.${key}`, options)
}

function countLabel(key, count) {
  return t(`counts.${key}`, { count })
}

function getPurchasedItems(purchase) {
  return purchase?.purchased_items || []
}

function getTicketGroups(purchase) {
  const groups = new Map()

  getPurchasedItems(purchase).forEach((item) => {
    const title = item.purchased_item?.title || t("fallbacks.ticket")
    const current = groups.get(title) || 0
    groups.set(title, current + (item.quantity || 1))
  })

  return Array.from(groups.entries()).map(([title, count]) => ({ title, count }))
}

function getTicketPurchaseContext(purchase) {
  const items = getPurchasedItems(purchase)
  const primaryItem = items[0]?.purchased_item
  const event = items.find((item) => item.purchased_item?.event)?.purchased_item?.event
  const ticketCount = items.reduce((total, item) => total + (item.quantity || 1), 0)

  return {
    event,
    title: event?.title || primaryItem?.title || t("fallbacks.purchase", { id: purchase.id }),
    ticketCount,
    groups: getTicketGroups(purchase),
  }
}

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || amount === "") return null

  const value = Number(amount)
  if (!Number.isFinite(value)) return null

  const currencyCode = String(currency || "USD").toUpperCase()

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value)
  } catch (_error) {
    return `$${value.toLocaleString("en-US")}`
  }
}

function getPurchaseCurrency(purchase) {
  return getPurchasedItems(purchase).find((item) => item.currency)?.currency
}

function getPurchaseTotal(purchase) {
  const itemTotal = getPurchasedItems(purchase).reduce((total, item) => {
    const price = Number(item.price)
    return Number.isFinite(price) ? total + price : total
  }, 0)

  return formatMoney(purchase.price ?? (itemTotal > 0 ? itemTotal : null), getPurchaseCurrency(purchase))
}

function getTicketSummary(context) {
  const ticketSummary = context.groups
    .slice(0, 2)
    .map((group) => `${group.count} x ${group.title}`)
    .join(", ")
  const suffix = context.groups.length > 2 ? ` + ${context.groups.length - 2} more` : ""

  return ticketSummary
    ? t("summaries.ticket_purchase", {
      count: context.ticketCount,
      count_label: countLabel("ticket", context.ticketCount),
      tickets: `${ticketSummary}${suffix}`,
    })
    : countLabel("ticket", context.ticketCount)
}

function getStatusVariant(status) {
  return status === "paid" ? "success" : "secondary"
}

function TicketPurchaseDetails({ purchase, onViewTicket }) {
  if (!purchase) return null

  const context = getTicketPurchaseContext(purchase)
  const total = getPurchaseTotal(purchase)

  return (
    <SheetContent className="flex h-full flex-col overflow-hidden">
      <SheetHeader className="shrink-0 pr-8">
        <SheetTitle>{t("details.title")}</SheetTitle>
        <SheetDescription>
          {context.title}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="mt-6 min-h-0 flex-1 pr-4">
        <div className="space-y-5">
          <section className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">{t("labels.event")}</p>
            <h2 className="mt-1 break-words text-lg font-semibold">{context.title}</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">{t("labels.purchased")}</p>
                <p className="font-medium">
                  {formatDistance(new Date(purchase.created_at), new Date(), { addSuffix: true })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("labels.status")}</p>
                <Badge variant={getStatusVariant(purchase.state)}>
                  {purchase.state}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">{t("labels.tickets")}</p>
                <p className="font-medium">{countLabel("ticket", context.ticketCount)}</p>
              </div>
              {total && (
                <div>
                  <p className="text-muted-foreground">{t("labels.total")}</p>
                  <p className="font-medium">{total}</p>
                </div>
              )}
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">{t("details.tickets_in_purchase")}</h3>
            <Badge variant="outline">{countLabel("ticket", context.ticketCount)}</Badge>
          </div>

          {purchase.purchased_items && purchase.purchased_items.map((item) => (
            <div key={item.id} className="space-y-4 p-4 border rounded-lg hover:bg-accent/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center space-x-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage
                      src={item.purchased_item.cover_url}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {item.purchased_item.title?.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h3 className="font-medium break-words">{item.purchased_item.title}</h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {item.purchased_item.description || item.purchased_item.type}
                    </p>
                  </div>
                </div>

                {item.purchased_item.type === "EventTicket" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full shrink-0 sm:w-auto"
                    onClick={() => onViewTicket(item)}
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    {t("actions.view_ticket")}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{t("labels.status")}</span>
                  <Badge variant={item.paid ? "success" : "secondary"}>
                    {item.state}
                  </Badge>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{t("labels.purchased")}</span>
                  <span className="text-sm text-right">
                    {formatDistance(new Date(purchase.created_at), new Date(), { addSuffix: true })}
                  </span>
                </div>
                {formatMoney(item.price, item.currency) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{t("labels.price")}</span>
                    <span className="text-sm text-right">
                      {formatMoney(item.price, item.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </SheetContent>
  )
}

function TicketPurchaseItem({ purchase, onClick }) {
  const context = getTicketPurchaseContext(purchase)
  const primaryItem = getPurchasedItems(purchase)[0]?.purchased_item
  const total = getPurchaseTotal(purchase)

  return (
    <button
      type="button"
      className="w-full rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent/50"
      onClick={() => onClick(purchase)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-12 w-12 shrink-0 rounded-md">
            <AvatarImage
              src={primaryItem?.cover_url}
              className="object-cover"
            />
            <AvatarFallback className="rounded-md">
              {context.title?.charAt(0) || "T"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t("labels.event")}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistance(new Date(purchase.created_at), new Date(), { addSuffix: true })}
              </span>
            </div>
            <h3 className="mt-1 truncate font-medium">{context.title}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {getTicketSummary(context)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant={getStatusVariant(purchase.state)}>
            {purchase.state}
          </Badge>
          {total && <Badge variant="outline">{total}</Badge>}
          <span className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium">
            {t("actions.details")}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function TicketPurchases({ purchases, loading, lastElementRef }) {
  const [selectedPurchase, setSelectedPurchase] = React.useState(null)
  const [selectedTicket, setSelectedTicket] = React.useState(null)
  const [selectedTicketPurchase, setSelectedTicketPurchase] = React.useState(null)

  return (
    <>
      <Sheet open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        <TicketPurchaseDetails 
          purchase={selectedPurchase} 
          onViewTicket={(item) => {
            setSelectedTicketPurchase(selectedPurchase)
            setSelectedPurchase(null)
            setSelectedTicket(item)
          }}
        />
      </Sheet>


      <EventTicketModal
        selectedTicket={selectedTicket}
        selectedPurchase={selectedTicketPurchase}
        ticketId={selectedTicket?.signed_id}
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null)
            setSelectedTicketPurchase(null)
          }
        }}
        onUpdate={(result) => {
          setSelectedTicket((currentTicket) => currentTicket && ({
            ...currentTicket,
            checked_in_at: result.event_ticket.purchased_item.checked_in_at,
            checked_in: result.event_ticket.purchased_item.checked_in
          }))
        }}
      />


      <ScrollArea className="h-[600px] rounded-md border p-4">
        {purchases.length > 0 || loading ? (
          <div className="space-y-4">
            {purchases.map((purchase, idx) => (
              <div key={purchase.id} ref={idx === purchases.length - 1 ? lastElementRef : null}>
                <TicketPurchaseItem
                  purchase={purchase}
                  onClick={setSelectedPurchase}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <Ticket className="mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-medium">{t("empty.tickets.title")}</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("empty.tickets.description")}
            </p>
          </div>
        )}
      </ScrollArea>
    </>
  )
}
