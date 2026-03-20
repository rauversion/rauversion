import React from "react"
import { Link, useSearchParams } from "react-router-dom"
import type { DateRange } from "react-day-picker"
import { format, isValid, parseISO, subDays } from "date-fns"
import { adminGetJson } from "./api"
import type { EventSalesDashboardData } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CalendarDays, CalendarIcon, Receipt, RotateCcw, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0))
}

function formatMoney(amount: number, currency: string) {
  const normalizedCurrency = (currency || "USD").toUpperCase()
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "CLP" ? 0 : 2,
  }).format(Number(amount || 0))
}

function formatDate(value?: string | null) {
  if (!value) return "No ticket sales yet"
  return new Date(value).toLocaleString()
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

const chartConfig = {
  sold_tickets: {
    label: "Sold tickets",
    color: "var(--chart-2)",
  },
}

export default function AdminEventSalesPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = React.useState<EventSalesDashboardData | null>(null)
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
        const payload = await adminGetJson<EventSalesDashboardData>(`/api/admin/event_sales${searchKey ? `?${searchKey}` : ""}`)
        setData(payload)
        setRange({
          from: parseDateInput(payload.range.from),
          to: parseDateInput(payload.range.to),
        })
      } catch (error: any) {
        toast({
          title: "Event sales dashboard failed",
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
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading event sales dashboard...</div>
  }

  if (!data) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Event sales dashboard unavailable.</div>
  }

  const topEventsChart = data.top_events.slice(0, 8).map((event) => ({
    title: event.title.length > 18 ? `${event.title.slice(0, 18)}…` : event.title,
    sold_tickets: event.sold_tickets,
  }))

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
                <p className="text-sm font-medium text-foreground">Select report range</p>
                <p className="text-xs text-muted-foreground">The dashboard updates after you apply the new range.</p>
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
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Event Sales</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Tickets sold, remaining inventory, refunds and the events moving the most volume.
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.paid_revenue_by_currency.map((entry) => (
                <div key={`paid-${entry.currency}`} className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Paid ticket revenue</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatMoney(entry.amount, entry.currency)}</p>
                  <p className="text-xs text-muted-foreground">{entry.currency}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-background/70 p-6">
            <p className="text-sm text-muted-foreground">Latest ticket sale</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatDate(data.summary.latest_sale_at)}</p>

            {data.refunded_revenue_by_currency.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Refunded</p>
                {data.refunded_revenue_by_currency.map((entry) => (
                  <div key={`refund-${entry.currency}`} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                    <span className="text-sm text-muted-foreground">{entry.currency}</span>
                    <span className="font-semibold text-destructive">{formatMoney(entry.amount, entry.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tickets sold", value: data.summary.sold_tickets, icon: Ticket },
          { label: "Remaining", value: data.summary.remaining_tickets, icon: RotateCcw },
          { label: "Refunded", value: data.summary.refunded_tickets, icon: Receipt },
          { label: "Events with sales", value: data.summary.events_with_sales, icon: CalendarDays },
        ].map((metric) => {
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

      <section>
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Top events by tickets sold</CardTitle>
          </CardHeader>
          <CardContent>
            {topEventsChart.length === 0 ? (
              <EmptyState label="No paid ticket sales yet." />
            ) : (
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <BarChart data={topEventsChart}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="title" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatNumber(Number(value))}
                        labelFormatter={(_value, payload) => payload?.[0]?.payload?.title || ""}
                      />
                    }
                  />
                  <Bar dataKey="sold_tickets" fill="var(--color-sold_tickets)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Top events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.top_events.length === 0 ? (
              <EmptyState label="No event sales yet." />
            ) : (
              data.top_events.map((event) => (
                <div key={`${event.id}-${event.currency}`} className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {event.event_path ? (
                        <Link to={event.event_path} className="font-medium text-foreground hover:text-primary hover:underline">
                          {event.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{event.title}</span>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.state} · {event.visibility} · {event.event_start ? formatDate(event.event_start) : "No start date"}
                      </p>
                      {event.organizer_path ? (
                        <Link to={event.organizer_path} className="mt-2 inline-flex text-sm text-foreground/80 hover:text-primary hover:underline">
                          {event.organizer_name}
                        </Link>
                      ) : (
                        <p className="mt-2 text-sm text-foreground/80">{event.organizer_name}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{formatNumber(event.sold_tickets)}</p>
                      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">sold</p>
                      <p className="mt-2 text-sm text-foreground/80">
                        {formatNumber(event.remaining_tickets)} remaining · {formatNumber(event.refunded_tickets)} refunded
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatMoney(event.revenue, event.currency)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Top ticket types</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_ticket_types.length === 0 ? (
              <EmptyState label="No ticket sales yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Refunds</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_ticket_types.map((ticket) => (
                    <TableRow key={`${ticket.id}-${ticket.currency}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{ticket.title}</span>
                          {ticket.archived && <Badge variant="secondary">Archived</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.event_path ? (
                          <Link to={ticket.event_path} className="text-foreground/80 hover:text-primary hover:underline">
                            {ticket.event_title}
                          </Link>
                        ) : (
                          ticket.event_title
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatNumber(ticket.sold_tickets)}</TableCell>
                      <TableCell className="text-right text-foreground">{formatNumber(ticket.remaining_tickets)}</TableCell>
                      <TableCell className="text-right text-foreground">{formatNumber(ticket.refunded_tickets)}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{formatMoney(ticket.revenue, ticket.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
