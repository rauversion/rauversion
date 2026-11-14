import React from "react"
import { useParams } from "react-router-dom"
import { get } from '@rails/request.js'
import I18n from '@/stores/locales'
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Ticket, Calendar, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"

const COLORS = {
  paid: "hsl(142, 76%, 36%)",
  invitation: "hsl(217, 78%, 52%)",
  pending: "hsl(48, 96%, 53%)",
  refunded: "hsl(0, 84%, 60%)",
}

const chartConfig = {
  paid: {
    label: "Paid",
    color: COLORS.paid,
  },
  invitation: {
    label: "Invitations",
    color: COLORS.invitation,
  },
  pending: {
    label: "Pending",
    color: COLORS.pending,
  },
  refunded: {
    label: "Refunded",
    color: COLORS.refunded,
  },
}

function currentLocale() {
  return I18n.locale?.startsWith("es") ? "es-CL" : "en-US"
}

function formatMoney(amount, currency = "usd") {
  try {
    return new Intl.NumberFormat(currentLocale(), {
      style: "currency",
      currency: currency.toUpperCase(),
      currencyDisplay: "symbol",
      minimumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
      maximumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
    }).format(Number(amount || 0))
  } catch {
    return `${currency.toUpperCase()} ${Number(amount || 0).toLocaleString(currentLocale())}`
  }
}

export default function Reports() {
  const { slug } = useParams()
  const isMobile = useIsMobile()
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [stats, setStats] = React.useState({
    paid: { count: 0, total: 0 },
    invitation: { count: 0 },
    pending: { count: 0, total: 0 },
    refunded: { count: 0, total: 0 },
  })
  const [ticketTypes, setTicketTypes] = React.useState([])
  const [event, setEvent] = React.useState(null)

  React.useEffect(() => {
    setLoading(true)
    fetchReportsData()
  }, [slug])

  const fetchReportsData = async () => {
    setRefreshing(true)
    setError(false)
    try {
      const response = await get(`/events/${slug}/event_reports/general_stats`)
      if (!response.ok) throw new Error("Could not load event reports")
      const data = await response.json

      setStats({
        paid: data.paid,
        invitation: data.invitation,
        pending: data.pending,
        refunded: data.refunded,
      })
      setTicketTypes(data.ticket_types || [])
      setEvent(data.event)
    } catch (error) {
      console.error("Error fetching reports data:", error)
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const totalRevenue = stats.paid.total
  const totalTicketsSold = stats.paid.count
  const totalTicketsAvailable = ticketTypes.reduce((total, ticketType) => total + ticketType.available_quantity, 0)

  const barChartData = [
    { name: I18n.t("events.edit.reports.status.paid"), value: stats.paid.total, fill: COLORS.paid },
    { name: I18n.t("events.edit.reports.status.pending"), value: stats.pending.total, fill: COLORS.pending },
    { name: I18n.t("events.edit.reports.status.refunded"), value: stats.refunded.total, fill: COLORS.refunded },
  ]

  const pieChartData = [
    { name: I18n.t("events.edit.reports.status.paid"), value: stats.paid.count, fill: COLORS.paid },
    { name: I18n.t("events.edit.reports.invitations"), value: stats.invitation.count, fill: COLORS.invitation },
    { name: I18n.t("events.edit.reports.status.pending"), value: stats.pending.count, fill: COLORS.pending },
    { name: I18n.t("events.edit.reports.status.refunded"), value: stats.refunded.count, fill: COLORS.refunded },
  ]

  const isEventStarted = event && new Date(event.event_start) <= new Date()
  const isEventEnded = event && new Date(event.event_ends) <= new Date()
  const chartHeightClassName = isMobile ? "h-[220px]" : "h-[300px]"
  const pieOuterRadius = isMobile ? 64 : 88
  const pieInnerRadius = isMobile ? 34 : 48

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{I18n.t("events.edit.reports.loading")}</div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="space-y-4 py-12 text-center" role="alert">
        <p className="text-muted-foreground">{I18n.t("events.edit.reports.load_error")}</p>
        <Button variant="outline" onClick={fetchReportsData} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          {I18n.t("events.edit.reports.refresh")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{I18n.t("events.edit.reports.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{I18n.t("events.edit.reports.description")}</p>
        </div>
        <Button variant="outline" className="rounded-full px-5" onClick={fetchReportsData} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          {I18n.t("events.edit.reports.refresh")}
        </Button>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{I18n.t("events.edit.reports.load_error")}</p>}

      <Card className="rounded-2xl shadow-none dark:bg-muted/20" aria-busy={refreshing}>
        <CardContent className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border p-0 lg:grid-cols-4">
          <div className="min-w-0 bg-card px-3 py-6 text-center sm:px-6 sm:py-10">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{I18n.t("events.edit.reports.total_revenue")}</p>
            <p className="mt-4 break-words text-3xl font-semibold tracking-tight tabular-nums lg:text-4xl">{formatMoney(totalRevenue, event?.currency)}</p>
          </div>
          <div className="min-w-0 bg-card px-3 py-6 text-center sm:px-6 sm:py-10">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{I18n.t("events.edit.reports.total_orders")}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums lg:text-4xl">{totalTicketsSold.toLocaleString(currentLocale())}</p>
          </div>
          <div className="min-w-0 bg-card px-3 py-6 text-center sm:px-6 sm:py-10">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{I18n.t("events.edit.reports.invitations")}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums lg:text-4xl">{stats.invitation.count.toLocaleString(currentLocale())}</p>
          </div>
          <div className="min-w-0 bg-card px-3 py-6 text-center sm:px-6 sm:py-10">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{I18n.t("events.edit.reports.tickets_available")}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums lg:text-4xl">{totalTicketsAvailable.toLocaleString(currentLocale())}</p>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="ticket-sales-title" className="space-y-4">
        <div>
          <h3 id="ticket-sales-title" className="text-lg font-semibold">{I18n.t("events.edit.reports.ticket_types.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{I18n.t("events.edit.reports.ticket_types.description")}</p>
        </div>
        {ticketTypes.length === 0 ? (
          <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
            {I18n.t("events.edit.reports.ticket_types.empty")}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ticketTypes.map((ticketType) => (
              <Card key={ticketType.id} className="flex min-w-0 flex-col rounded-2xl shadow-none dark:bg-muted/20">
                <CardHeader className="pb-5">
                  <CardTitle className="break-words text-lg leading-snug">{ticketType.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-6">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      {I18n.t("events.edit.reports.ticket_types.total")}
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold tracking-tight tabular-nums">{formatMoney(ticketType.revenue, event?.currency)}</p>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Ticket className="h-4 w-4 shrink-0" aria-hidden="true" />{I18n.t("events.edit.reports.ticket_types.tickets")}</dt>
                      <dd className="font-semibold tabular-nums">{ticketType.count.toLocaleString(currentLocale())}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{I18n.t("events.edit.reports.invitations")}</dt>
                      <dd className="font-semibold tabular-nums">{ticketType.invitation.count.toLocaleString(currentLocale())}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{I18n.t("events.edit.reports.tickets_available")}</dt>
                      <dd className="font-semibold tabular-nums">{ticketType.available_quantity.toLocaleString(currentLocale())}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-muted-foreground">
                      <dt>{I18n.t("events.edit.reports.ticket_types.pending_tickets")}</dt>
                      <dd className="tabular-nums">{ticketType.pending.count.toLocaleString(currentLocale())}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto pt-6">
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{I18n.t("events.edit.reports.ticket_types.sales_percentage")}</span>
                      <span className="font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                        {new Intl.NumberFormat(currentLocale(), { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ticketType.sales_percentage / 100)}
                      </span>
                    </div>
                    <Progress
                      value={ticketType.sales_percentage}
                      className="h-2 bg-muted"
                      indicatorStyle={{ backgroundColor: "#f97316", borderRadius: "9999px" }}
                      aria-label={I18n.t("events.edit.reports.ticket_types.sales_progress", { title: ticketType.title })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Event Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {I18n.t("events.edit.reports.event_status.title")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isEventEnded ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                    {I18n.t("events.edit.reports.event_status.ended")}
                  </Badge>
                </>
              ) : isEventStarted ? (
                <>
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {I18n.t("events.edit.reports.event_status.in_progress")}
                  </Badge>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-orange-600" />
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {I18n.t("events.edit.reports.event_status.upcoming")}
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {I18n.t("events.edit.reports.payout_date.title")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {I18n.t("events.edit.reports.payout_date.pending")}
            </div>
            <p className="text-xs text-muted-foreground">
              {I18n.t("events.edit.reports.payout_date.description")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards by Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {I18n.t("events.edit.reports.status.paid")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats.paid.total, event?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paid.count} {I18n.t("events.edit.reports.orders")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {I18n.t("events.edit.reports.status.pending")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats.pending.total, event?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pending.count} {I18n.t("events.edit.reports.orders")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {I18n.t("events.edit.reports.status.refunded")}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats.refunded.total, event?.currency)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.refunded.count} {I18n.t("events.edit.reports.orders")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* Bar Chart - Revenue by Status */}
        <Card>
          <CardHeader>
            <CardTitle>{I18n.t("events.edit.reports.charts.revenue_by_status")}</CardTitle>
            <CardDescription>
              {I18n.t("events.edit.reports.charts.revenue_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className={`w-full min-w-0 aspect-auto overflow-hidden ${chartHeightClassName}`}>
              <BarChart
                data={barChartData}
                margin={isMobile ? { top: 8, right: 8, left: -20, bottom: 0 } : { top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: isMobile ? 11 : 12 }}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 11 : 12 }}
                  tickFormatter={(value) => formatMoney(value, event?.currency)}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 48 : 64}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={isMobile ? 42 : 64} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Orders Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{I18n.t("events.edit.reports.charts.orders_distribution")}</CardTitle>
            <CardDescription>
              {I18n.t("events.edit.reports.charts.orders_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className={`w-full min-w-0 aspect-auto overflow-hidden ${chartHeightClassName}`}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={isMobile ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={pieOuterRadius}
                  innerRadius={pieInnerRadius}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieChartData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="truncate">{entry.name}</span>
                  </div>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
