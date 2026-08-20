import React from "react"
import { Link, useSearchParams } from "react-router-dom"
import type { DateRange } from "react-day-picker"
import { format, isValid, parseISO, subDays } from "date-fns"
import { adminGetJson } from "./api"
import type { AdminBookingSummary, AdminPersonSummary, AdminProposalSummary, BookingsDashboardData } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CalendarCheck,
  CalendarIcon,
  HandCoins,
  Handshake,
  RotateCcw,
  ShieldAlert,
  WalletCards,
} from "lucide-react"
import { cn } from "@/lib/utils"

type MoneyStat = { currency: string; amount: number }

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0))
}

function formatMoney(amount: number | string | null | undefined, currency: string) {
  const normalizedCurrency = (currency || "USD").toUpperCase()
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "CLP" ? 0 : 2,
  }).format(Number(amount || 0))
}

function formatDate(value?: string | null, fallback = "No activity yet") {
  if (!value) return fallback
  return new Date(value).toLocaleString()
}

function humanize(value?: string | null) {
  if (!value) return "unknown"

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusTone(status?: string | null) {
  const normalized = status || ""

  if (normalized.endsWith("_confirmed")) return "border-chart-2/30 bg-chart-2/10 text-foreground"
  if (normalized.includes("checkout_created") || normalized.includes("pending") || normalized.includes("reported") || normalized.includes("unpaid")) {
    return "border-chart-4/30 bg-chart-4/10 text-foreground"
  }
  if (normalized.includes("cancelled") || normalized.includes("failed") || normalized.includes("refunded") || normalized.includes("rejected")) {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }

  switch (normalized) {
    case "accepted":
    case "auto_signed":
    case "completed":
    case "confirmed":
    case "paid":
    case "payment_confirmed":
    case "payout_calculated":
    case "scheduled":
      return "border-chart-2/30 bg-chart-2/10 text-foreground"
    case "balance":
    case "checkout_created":
    case "countered_by_artist":
    case "countered_by_booker":
    case "deposit":
    case "pending":
    case "pending_artist_response":
    case "pending_confirmation":
    case "payment_reported":
    case "processing":
    case "reported":
      return "border-chart-4/30 bg-chart-4/10 text-foreground"
    case "cancelled":
    case "expired":
    case "failed":
    case "refund_failed":
    case "refunded":
    case "rejected":
      return "border-destructive/30 bg-destructive/10 text-destructive"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", statusTone(status))}>
      {humanize(status)}
    </span>
  )
}

function MoneyList({ amounts, emptyLabel = "No amount yet" }: { amounts: MoneyStat[]; emptyLabel?: string }) {
  if (!amounts.length) return <span className="text-sm text-muted-foreground">{emptyLabel}</span>

  return (
    <div className="flex flex-wrap gap-2">
      {amounts.map((entry) => (
        <Badge key={`${entry.currency}-${entry.amount}`} variant="secondary" className="rounded-full">
          {formatMoney(entry.amount, entry.currency)}
        </Badge>
      ))}
    </div>
  )
}

function PersonLink({ person }: { person?: AdminPersonSummary | null }) {
  if (!person) return <span className="text-muted-foreground">Unknown</span>
  if (!person.path) return <span>{person.name}</span>

  return (
    <Link to={person.path} className="text-foreground/80 hover:text-primary hover:underline">
      {person.name}
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>
}

function defaultDateRange(): DateRange {
  const today = new Date()
  return {
    from: subDays(today, 29),
    to: today,
  }
}

function formatDateInput(value: Date) {
  return format(value, "yyyy-MM-dd")
}

function parseDateInput(value?: string | null) {
  if (!value) return undefined

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

function searchParamsToRange(searchParams: URLSearchParams): DateRange {
  const from = parseDateInput(searchParams.get("from"))
  const to = parseDateInput(searchParams.get("to"))

  if (!from && !to) return defaultDateRange()

  return {
    from: from || to,
    to: to || from,
  }
}

function rangeLabel(range?: DateRange) {
  if (!range?.from) return "Pick a date range"
  if (!range.to) return format(range.from, "LLL dd, y")

  return `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`
}

function BreakdownList({ rows, labelKey }: { rows: Array<Record<string, any> & { count: number }>; labelKey: string }) {
  const max = Math.max(...rows.map((row) => Number(row.count || 0)), 1)

  if (!rows.length) return <EmptyState label="No records in this range." />

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const label = row[labelKey]
        const width = `${Math.max((Number(row.count || 0) / max) * 100, 6)}%`

        return (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <StatusPill status={label} />
              <span className="text-sm font-medium text-foreground">{formatNumber(row.count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BookingTable({ bookings, emptyLabel }: { bookings: AdminBookingSummary[]; emptyLabel: string }) {
  if (!bookings.length) return <EmptyState label={emptyLabel} />

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking</TableHead>
            <TableHead>Parties</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Payout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">#{booking.id} · {booking.event_name || booking.product_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.product_title || "Service"} · {formatDate(booking.starts_at || booking.created_at, "No date")}
                  </p>
                  {booking.venue && <p className="text-xs text-muted-foreground">{booking.venue}</p>}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Artist:</span> <PersonLink person={booking.provider} /></p>
                  <p><span className="text-muted-foreground">Booker:</span> <PersonLink person={booking.customer} /></p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={booking.status} />
                  <StatusPill status={booking.refund_status} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={booking.payment_status} />
                  <StatusPill status={`deposit_${booking.deposit_status}`} />
                  <StatusPill status={`balance_${booking.balance_status}`} />
                </div>
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {formatMoney(booking.total_amount, booking.currency)}
              </TableCell>
              <TableCell className="text-right text-foreground">
                {formatMoney(booking.artist_payout_amount, booking.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: AdminProposalSummary }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">#{proposal.id} · {proposal.event_name}</p>
            <StatusPill status={proposal.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {humanize(proposal.fee_type)} · {proposal.venue || "Venue pending"} · {formatDate(proposal.starts_at || proposal.event_date, "No date")}
          </p>
          <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Artist:</span> <PersonLink person={proposal.artist} /></p>
            <p><span className="text-muted-foreground">Booker:</span> <PersonLink person={proposal.booker} /></p>
            <p><span className="text-muted-foreground">Current offer:</span> <PersonLink person={proposal.current_offer_by} /></p>
            <p><span className="text-muted-foreground">Counters:</span> {proposal.total_counter_count}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-foreground">{formatMoney(proposal.proposed_amount, proposal.currency)}</p>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">offer</p>
          <p className="mt-2 text-sm text-foreground/80">{formatMoney(proposal.artist_payout_amount, proposal.currency)} payout</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = React.useState<BookingsDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [range, setRange] = React.useState<DateRange | undefined>(() => searchParamsToRange(searchParams))
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const searchKey = searchParams.toString()

  React.useEffect(() => {
    setRange(searchParamsToRange(new URLSearchParams(searchKey)))
  }, [searchKey])

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const payload = await adminGetJson<BookingsDashboardData>(`/api/admin/bookings${searchKey ? `?${searchKey}` : ""}`)
        setData(payload)
        setRange({
          from: parseDateInput(payload.range.from),
          to: parseDateInput(payload.range.to),
        })
      } catch (error: any) {
        toast({
          title: "Bookings dashboard failed",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [searchKey, toast])

  function applyRange() {
    if (!range?.from) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("from", formatDateInput(range.from))
    nextParams.set("to", formatDateInput(range.to || range.from))
    setSearchParams(nextParams, { replace: true })
    setPickerOpen(false)
  }

  function resetRange() {
    const nextRange = defaultDateRange()
    setRange(nextRange)
    setSearchParams(
      {
        from: formatDateInput(nextRange.from as Date),
        to: formatDateInput(nextRange.to as Date),
      },
      { replace: true }
    )
  }

  if (loading) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading bookings dashboard...</div>
  }

  if (!data) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Bookings dashboard unavailable.</div>
  }

  const metrics = [
    { label: "Active bookings", value: data.summary.active_bookings, icon: CalendarCheck },
    { label: "Pending deposits", value: data.summary.pending_deposits, icon: WalletCards },
    { label: "Pending balances", value: data.summary.pending_balances, icon: HandCoins },
    { label: "Open proposals", value: data.summary.open_proposals, icon: Handshake },
    { label: "Counteroffers", value: data.summary.counteroffers, icon: RotateCcw },
    { label: "Cancellations", value: data.summary.cancellations, icon: ShieldAlert },
  ]

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 rounded-[1.75rem] border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Date range</p>
          <p className="text-sm text-muted-foreground">
            Showing {rangeLabel(range)} · {data.range.days} days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[260px] justify-start text-left font-normal",
                  !range?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {rangeLabel(range)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-foreground">Select operations range</p>
                <p className="text-xs text-muted-foreground">Bookings, proposals, and ledger rows update after applying.</p>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={range?.from}
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
              />
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-xs text-muted-foreground">{rangeLabel(range)}</span>
                <Button size="sm" onClick={applyRange} disabled={!range?.from}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="secondary" onClick={resetRange}>
            <RotateCcw className="h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-muted shadow-xl">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.35fr_0.9fr] lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Bookings</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Booking operations, negotiations, payment flow, refunds, and calculated artist payouts.
            </h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Booking volume</p>
                <div className="mt-2"><MoneyList amounts={data.booking_amounts_by_currency} emptyLabel="No bookings" /></div>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Payouts</p>
                <div className="mt-2"><MoneyList amounts={data.calculated_payouts_by_currency} emptyLabel="No payouts" /></div>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Platform fees</p>
                <div className="mt-2"><MoneyList amounts={data.platform_fees_by_currency} emptyLabel="No fees" /></div>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Proposal volume</p>
                <div className="mt-2"><MoneyList amounts={data.proposal_volume_by_currency} emptyLabel="No proposals" /></div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-background/70 p-6">
            <p className="text-sm text-muted-foreground">Latest activity</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Booking</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatDate(data.summary.latest_booking_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Proposal</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatDate(data.summary.latest_proposal_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Ledger</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatDate(data.summary.latest_ledger_at)}</p>
              </div>
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-destructive">Refund watch</p>
                <p className="mt-2 text-2xl font-semibold text-destructive">{formatNumber(data.summary.refund_cases)}</p>
                <MoneyList amounts={data.refunds_by_currency} emptyLabel="No refunds in range" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="rounded-[1.75rem] border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-card-foreground">{formatNumber(metric.value)}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.action_queue.map((item) => (
          <Card key={item.key} className="rounded-[1.75rem] border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{item.label}</CardTitle>
              <CardDescription>Current operational queue, not limited by the report range.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <p className="text-3xl font-semibold text-foreground">{formatNumber(item.count)}</p>
                <MoneyList amounts={item.amounts} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Booking status</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={data.booking_status_counts} labelKey="status" />
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Payment status</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={data.payment_status_counts} labelKey="status" />
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Proposal status</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={data.proposal_status_counts} labelKey="status" />
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Ledger activity</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownList rows={data.ledger_activity_counts} labelKey="entry_type" />
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Recent bookings</CardTitle>
          <CardDescription>Latest service bookings created inside the selected range.</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingTable bookings={data.recent_bookings} emptyLabel="No bookings in this range." />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Recent proposals</CardTitle>
            <CardDescription>Offers and counter-offers updated inside the selected range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recent_proposals.length === 0 ? (
              <EmptyState label="No proposals in this range." />
            ) : (
              data.recent_proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Counter-offer pressure</CardTitle>
            <CardDescription>Negotiations with the highest amount of back and forth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.counter_activity.length === 0 ? (
              <EmptyState label="No counter-offers yet." />
            ) : (
              data.counter_activity.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Payment ledger</CardTitle>
            <CardDescription>Append-only events for deposits, balances, refunds, and payout calculations.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recent_ledger_entries.length === 0 ? (
              <EmptyState label="No ledger entries in this range." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Ledger</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent_ledger_entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">#{entry.service_booking_id} · {entry.event_name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(entry.occurred_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <StatusPill status={entry.entry_type} />
                            <StatusPill status={entry.milestone} />
                            <StatusPill status={entry.direction} />
                          </div>
                        </TableCell>
                        <TableCell><PersonLink person={entry.actor} /></TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>{entry.gateway || "manual"}</p>
                            {entry.gateway_reference && <p className="max-w-[180px] truncate text-xs text-muted-foreground">{entry.gateway_reference}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">{formatMoney(entry.amount, entry.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Cancellations and refunds</CardTitle>
            <CardDescription>Recent cancelled bookings and active refund cases.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingTable bookings={data.recent_cancellations} emptyLabel="No cancellations or refund cases." />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
