import React from "react"
import { format } from "date-fns"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import I18n from "@/stores/locales"

interface Conversation {
  id: number
  subject: string
  status: string
  created_at: string
}

interface ServiceBooking {
  id: number
  status: string
  created_at: string
  service_product: {
    id: number
    title: string
    service_kind?: string
    category?: string
    booking_mode?: string
    delivery_method: string
  }
  customer: {
    id: number
    name: string
    avatar_url: string
  }
  provider: {
    id: number
    name: string
    avatar_url: string
  }
  metadata: {
    scheduled_date?: string
    scheduled_time?: string
    timezone?: string
    meeting_link?: string
    meeting_location?: string
    special_requirements?: string
    provider_notes?: string
    cancellation_reason?: string
  }
  payment?: {
    status: string
    refund_status?: string
    currency: string
    total_amount?: number | string
    deposit_status?: string
    balance_status?: string
  }
  conversations: Conversation[]
}

interface Props {
  bookings: ServiceBooking[]
}

type Tone = "neutral" | "primary" | "accent" | "secondary" | "success" | "destructive"

const toneClasses: Record<Tone, { pill: string; panel: string; dot: string; bar: string }> = {
  neutral: {
    pill: "border-border bg-muted text-muted-foreground",
    panel: "border-border bg-muted/40",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground",
  },
  primary: {
    pill: "border-chart-1/30 bg-chart-1/10 text-foreground",
    panel: "border-chart-1/20 bg-chart-1/10",
    dot: "bg-chart-1",
    bar: "bg-chart-1",
  },
  accent: {
    pill: "border-chart-3/30 bg-chart-3/10 text-foreground",
    panel: "border-chart-3/20 bg-chart-3/10",
    dot: "bg-chart-3",
    bar: "bg-chart-3",
  },
  secondary: {
    pill: "border-chart-4/30 bg-chart-4/10 text-foreground",
    panel: "border-chart-4/20 bg-chart-4/10",
    dot: "bg-chart-4",
    bar: "bg-chart-4",
  },
  success: {
    pill: "border-chart-2/30 bg-chart-2/10 text-foreground",
    panel: "border-chart-2/20 bg-chart-2/10",
    dot: "bg-chart-2",
    bar: "bg-chart-2",
  },
  destructive: {
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    panel: "border-destructive/20 bg-destructive/10",
    dot: "bg-destructive",
    bar: "bg-destructive",
  },
}

const bookingStatusTone: Record<string, Tone> = {
  pending_confirmation: "primary",
  confirmed: "primary",
  scheduled: "secondary",
  in_progress: "accent",
  completed: "success",
  cancelled: "destructive",
  refunded: "neutral",
}

const paymentStatusTone: Record<string, Tone> = {
  unpaid: "neutral",
  pending: "primary",
  checkout_created: "accent",
  reported: "primary",
  confirmed: "success",
  paid: "success",
  partially_refunded: "secondary",
  refunded: "neutral",
  failed: "destructive",
}

const humanize = (value?: string) =>
  (value || "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

const translated = (scope: string, value?: string) =>
  value ? I18n.t(`${scope}.${value}`, { defaultValue: humanize(value) }) : ""

const serviceKindLabel = (value?: string) =>
  value ? I18n.t(`products.service.service_kinds.${value}.label`, { defaultValue: humanize(value) }) : ""

const serviceCategoryLabel = (value?: string) =>
  value ? I18n.t(`products.service.categories.${value}`, { defaultValue: humanize(value) }) : ""

const bookingModeLabel = (value?: string) =>
  value ? I18n.t(`products.service.booking_modes.${value}`, { defaultValue: humanize(value) }) : ""

const deliveryMethodLabel = (value?: string) => {
  if (!value) return ""

  return I18n.t(`products.service.delivery_methods.${value === "both" ? "hybrid" : value}`, {
    defaultValue: humanize(value),
  })
}

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

const formatDate = (value?: string, pattern = "PPP") => {
  if (!value) return null

  try {
    return format(new Date(value), pattern)
  } catch (_error) {
    return value
  }
}

const formatMoney = (amount?: number | string, currency = "usd") => {
  if (amount === null || amount === undefined) return null

  const currencyCode = String(currency || "usd").toUpperCase()
  const numericAmount = Number(amount)

  if (Number.isNaN(numericAmount)) {
    return `${amount} ${currencyCode}`
  }

  return numericAmount.toLocaleString(undefined, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    maximumFractionDigits: currencyCode === "CLP" ? 0 : 2,
  })
}

function StatusPill({
  label,
  tone = "neutral",
  icon: Icon,
}: {
  label: string
  tone?: Tone
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone].pill}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="truncate">{label}</span>
    </span>
  )
}

function PersonChip({
  label,
  person,
}: {
  label: string
  person: { name: string; avatar_url: string }
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/70 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="h-8 w-8 border border-background">
          <AvatarImage src={person.avatar_url} />
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">{person.name}</span>
      </div>
    </div>
  )
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-semibold text-foreground">{value || "-"}</div>
      </div>
    </div>
  )
}

export function ServiceBookingsList({ bookings }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bookings?.length === 0 && (
        <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="font-semibold text-foreground">{I18n.t("service_bookings.index.no_bookings")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {I18n.t("service_bookings.index.no_bookings_description")}
          </p>
        </div>
      )}

      {bookings?.map((booking) => {
        const bookingTone = bookingStatusTone[booking.status] || "neutral"
        const paymentTone = paymentStatusTone[booking.payment?.status || "unpaid"] || "neutral"
        const scheduledLabel = [
          formatDate(booking.metadata.scheduled_date),
          booking.metadata.scheduled_time,
        ].filter(Boolean).join(` ${I18n.t("service_bookings.labels.at")} `)
        const location = booking.metadata.meeting_location || deliveryMethodLabel(booking.service_product.delivery_method)
        const amount = formatMoney(booking.payment?.total_amount, booking.payment?.currency)

        return (
          <Card
            key={booking.id}
            className="group relative overflow-hidden border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`h-1.5 ${toneClasses[bookingTone].bar}`} />
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {booking.service_product.service_kind && (
                      <Badge variant="secondary">{serviceKindLabel(booking.service_product.service_kind)}</Badge>
                    )}
                    {booking.service_product.category && (
                      <Badge variant="outline">{serviceCategoryLabel(booking.service_product.category)}</Badge>
                    )}
                    {booking.service_product.booking_mode && (
                      <Badge variant="outline">{bookingModeLabel(booking.service_product.booking_mode)}</Badge>
                    )}
                  </div>
                  <Link
                    to={`/service_bookings/${booking.id}`}
                    className="line-clamp-2 text-lg font-semibold text-foreground hover:text-primary hover:underline"
                  >
                    {booking.service_product.title}
                  </Link>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {I18n.t("service_bookings.labels.created_on", {
                      date: formatDate(booking.created_at),
                    })}
                  </div>
                </div>

                <Button asChild size="icon" variant="ghost" className="shrink-0">
                  <Link
                    to={`/service_bookings/${booking.id}`}
                    aria-label={I18n.t("service_bookings.index.view_details")}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <StatusPill
                  label={translated("service_bookings.status", booking.status)}
                  tone={bookingTone}
                  icon={ShieldCheck}
                />
                {booking.payment && (
                  <StatusPill
                    label={translated("service_bookings.payment_statuses", booking.payment.status)}
                    tone={paymentTone}
                    icon={WalletCards}
                  />
                )}
              </div>

              <div className={`mb-4 rounded-lg border p-4 ${toneClasses[paymentTone].panel}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                      <ReceiptText className="h-3.5 w-3.5" />
                      {I18n.t("service_bookings.payment.total")}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-foreground">{amount || "-"}</div>
                  </div>
                  {booking.payment?.currency && (
                    <Badge variant="outline">{booking.payment.currency.toUpperCase()}</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${toneClasses[paymentStatusTone[booking.payment?.deposit_status || "unpaid"] || "neutral"].dot}`}
                    />
                    <span className="truncate">
                      {I18n.t("service_bookings.payment.deposit")}:{" "}
                      {translated("service_bookings.payment_statuses", booking.payment?.deposit_status || "unpaid")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${toneClasses[paymentStatusTone[booking.payment?.balance_status || "unpaid"] || "neutral"].dot}`}
                    />
                    <span className="truncate">
                      {I18n.t("service_bookings.payment.balance")}:{" "}
                      {translated("service_bookings.payment_statuses", booking.payment?.balance_status || "unpaid")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <PersonChip label={I18n.t("service_bookings.labels.provider")} person={booking.provider} />
                <PersonChip label={I18n.t("service_bookings.labels.customer")} person={booking.customer} />
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  icon={Clock3}
                  label={I18n.t("service_bookings.labels.scheduled_for")}
                  value={scheduledLabel || I18n.t("service_bookings.index.not_scheduled")}
                />
                <MiniMetric
                  icon={MapPin}
                  label={I18n.t("service_bookings.labels.location")}
                  value={location}
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button asChild variant="secondary" className="min-w-0 flex-1">
                  <Link to={`/service_bookings/${booking.id}`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {I18n.t("service_bookings.index.view_details")}
                  </Link>
                </Button>

                {booking.conversations && booking.conversations.length > 0 && (
                  <Button asChild variant="outline" size="icon" className="shrink-0">
                    <Link
                      to={`/conversations/${booking.conversations[0].id}`}
                      aria-label={I18n.t("service_bookings.labels.view_conversation")}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
