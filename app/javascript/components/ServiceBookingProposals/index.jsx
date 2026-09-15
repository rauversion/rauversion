import React from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { get } from "@rails/request.js"
import { format } from "date-fns"
import {
  ArrowUpRight,
  CalendarDays,
  FileSignature,
  HandCoins,
  Loader2,
  MapPin,
  MessageCircle,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import I18n from "@/stores/locales"

const toneClasses = {
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

const proposalStatusTone = {
  pending_artist_response: "primary",
  countered_by_artist: "accent",
  countered_by_booker: "secondary",
  accepted: "success",
  rejected: "destructive",
  cancelled: "destructive",
  expired: "neutral",
}

const currency = (amount, code = "clp") => {
  if (amount === null || amount === undefined || amount === "") return ""

  const currencyCode = String(code || "clp").toUpperCase()
  const value = Number(amount || 0)

  if (Number.isNaN(value)) {
    return `${amount} ${currencyCode}`
  }

  return value.toLocaleString(undefined, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    maximumFractionDigits: currencyCode === "CLP" ? 0 : 2,
  })
}

const humanize = (value = "") =>
  value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

const translated = (scope, value) =>
  value ? I18n.t(`${scope}.${value}`, { defaultValue: humanize(value) }) : ""

const serviceKindLabel = (value) =>
  value ? I18n.t(`products.service.service_kinds.${value}.label`, { defaultValue: humanize(value) }) : ""

const serviceCategoryLabel = (value) =>
  value ? I18n.t(`products.service.categories.${value}`, { defaultValue: humanize(value) }) : ""

const bookingModeLabel = (value) =>
  value ? I18n.t(`products.service.booking_modes.${value}`, { defaultValue: humanize(value) }) : ""

const initials = (name = "?") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

const formatDate = (value, pattern = "PPP") => {
  if (!value) return null

  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
    return format(date, pattern)
  } catch (_error) {
    return value
  }
}

function StatusPill({ label, tone = "neutral", icon: Icon }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone].pill}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="truncate">{label}</span>
    </span>
  )
}

function MiniMetric({ icon: Icon, label, value }) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : value

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-semibold text-foreground">{displayValue}</div>
      </div>
    </div>
  )
}

function PersonChip({ label, person }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background/70 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="h-8 w-8 border border-background">
          <AvatarImage src={person?.avatar_url} />
          <AvatarFallback>{initials(person?.name)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">{person?.name || "-"}</span>
      </div>
    </div>
  )
}

const formattedAmount = (proposal, formattedField, amountField) =>
  proposal[formattedField] || currency(proposal[amountField], proposal.currency)

export function ServiceBookingProposals() {
  const { data, isLoading } = useQuery({
    queryKey: ["service_booking_proposals"],
    queryFn: async () => {
      const response = await get("/service_booking_proposals.json", {
        responseKind: "json",
      })
      return response.json
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-6">
        <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const proposals = data?.service_booking_proposals || []

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="mb-6 border-b border-border pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <FileSignature className="h-3.5 w-3.5" />
              {I18n.t("menu.service_booking_proposals", {
                defaultValue: I18n.t("service_booking_proposals.index.title"),
              })}
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              {I18n.t("service_booking_proposals.index.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {I18n.t("service_booking_proposals.index.subtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-lg border border-border bg-background/70 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <FileSignature className="h-3.5 w-3.5" />
                {I18n.t("service_booking_proposals.index.count_label")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{proposals.length}</div>
            </div>
            <Button asChild variant="outline">
              <Link to="/service_bookings">{I18n.t("service_booking_proposals.index.view_bookings")}</Link>
            </Button>
          </div>
        </div>
      </div>

      {proposals.length === 0 ? (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
              <FileSignature className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="font-semibold text-foreground">{I18n.t("service_booking_proposals.index.empty")}</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proposals.map((proposal) => {
            const statusTone = proposalStatusTone[proposal.status] || "neutral"
            const location = [proposal.venue_name, proposal.city, proposal.country].filter(Boolean).join(", ")
            const counterCount = Number(proposal.booker_counter_count || 0) + Number(proposal.artist_counter_count || 0)

            return (
              <Card
                key={proposal.id}
                className="group relative overflow-hidden border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`h-1.5 ${toneClasses[statusTone].bar}`} />
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {proposal.service_product?.service_kind && (
                          <Badge variant="secondary">{serviceKindLabel(proposal.service_product.service_kind)}</Badge>
                        )}
                        {proposal.service_product?.category && (
                          <Badge variant="outline">{serviceCategoryLabel(proposal.service_product.category)}</Badge>
                        )}
                        {proposal.service_product?.booking_mode && (
                          <Badge variant="outline">{bookingModeLabel(proposal.service_product.booking_mode)}</Badge>
                        )}
                      </div>
                      <Link
                        to={`/service_booking_proposals/${proposal.id}`}
                        className="line-clamp-2 text-lg font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {proposal.event_name}
                      </Link>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {I18n.t("service_booking_proposals.labels.created_on", {
                          date: formatDate(proposal.created_at),
                        })}
                      </div>
                    </div>

                    <Button asChild size="icon" variant="ghost" className="shrink-0">
                      <Link
                        to={`/service_booking_proposals/${proposal.id}`}
                        aria-label={I18n.t("service_booking_proposals.index.open")}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <StatusPill
                      label={translated("service_booking_proposals.status", proposal.status)}
                      tone={statusTone}
                      icon={ShieldCheck}
                    />
                    {proposal.viewer?.role && (
                      <StatusPill
                        label={translated("service_booking_proposals.viewer", proposal.viewer.role)}
                        tone="neutral"
                        icon={UserRound}
                      />
                    )}
                  </div>

                  <div className={`mb-4 rounded-lg border p-4 ${toneClasses[statusTone].panel}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                          <ReceiptText className="h-3.5 w-3.5" />
                          {I18n.t("service_booking_proposals.labels.amount")}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">
                          {formattedAmount(proposal, "formatted_proposed_amount", "proposed_amount")}
                        </div>
                      </div>
                      {proposal.currency && <Badge variant="outline">{proposal.currency.toUpperCase()}</Badge>}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <MiniMetric
                        icon={WalletCards}
                        label={I18n.t("service_booking_proposals.labels.deposit")}
                        value={`${proposal.deposit_percentage || 0}% · ${formattedAmount(proposal, "formatted_deposit_amount", "deposit_amount")}`}
                      />
                      <MiniMetric
                        icon={HandCoins}
                        label={I18n.t("service_booking_proposals.labels.balance")}
                        value={formattedAmount(proposal, "formatted_balance_amount", "balance_amount")}
                      />
                      <MiniMetric
                        icon={ReceiptText}
                        label={I18n.t("service_booking_proposals.labels.artist_payout")}
                        value={formattedAmount(proposal, "formatted_artist_payout_amount", "artist_payout_amount")}
                      />
                      <MiniMetric
                        icon={ShieldCheck}
                        label={I18n.t("service_booking_proposals.labels.fee_type")}
                        value={translated("service_booking_proposals.fee_type_labels", proposal.fee_type)}
                      />
                    </div>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <PersonChip label={I18n.t("service_booking_proposals.labels.artist")} person={proposal.artist} />
                    <PersonChip label={I18n.t("service_booking_proposals.labels.booker")} person={proposal.booker} />
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <MiniMetric
                      icon={CalendarDays}
                      label={I18n.t("service_booking_proposals.form.event_date")}
                      value={formatDate(proposal.event_date) || I18n.t("service_booking_proposals.index.date_pending")}
                    />
                    <MiniMetric
                      icon={MapPin}
                      label={I18n.t("service_bookings.labels.location")}
                      value={location || I18n.t("service_booking_proposals.index.location_pending")}
                    />
                    <MiniMetric
                      icon={RotateCcw}
                      label={I18n.t("service_booking_proposals.labels.counters")}
                      value={counterCount}
                    />
                    <MiniMetric
                      icon={MessageCircle}
                      label={I18n.t("service_booking_proposals.labels.conversation")}
                      value={proposal.conversations?.length || 0}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <Button asChild variant="secondary" className="min-w-0 flex-1">
                      <Link to={`/service_booking_proposals/${proposal.id}`}>
                        <FileSignature className="mr-2 h-4 w-4" />
                        {I18n.t("service_booking_proposals.index.open")}
                      </Link>
                    </Button>

                    {proposal.conversations && proposal.conversations.length > 0 && (
                      <Button asChild variant="outline" size="icon" className="shrink-0">
                        <Link
                          to={`/conversations/${proposal.conversations[0].id}`}
                          aria-label={I18n.t("service_booking_proposals.labels.conversation")}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {proposal.service_booking_id && (
                      <Button asChild variant="outline" size="icon" className="shrink-0">
                        <Link
                          to={`/service_bookings/${proposal.service_booking_id}`}
                          aria-label={I18n.t("service_booking_proposals.actions.view_booking")}
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
