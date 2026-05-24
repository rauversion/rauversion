import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { differenceInCalendarDays, format, formatDistance, isValid, parseISO, subDays } from "date-fns"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { get } from "@rails/request.js"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUpRight,
  CalendarIcon,
  CircleDollarSign,
  Disc3,
  LayoutDashboard,
  Loader2,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Ticket,
  TrendingUp,
} from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import I18n from "@/stores/locales"
import { cn } from "@/lib/utils"

const DASHBOARD_RANGE_DAYS = 365

const SALES_TABS = [
  { value: "Dashboard", labelKey: "tabs.dashboard", icon: LayoutDashboard },
  { value: "Album", labelKey: "tabs.albums", icon: Disc3 },
  { value: "Track", labelKey: "tabs.tracks", icon: TrendingUp },
  { value: "Product", labelKey: "tabs.products", icon: Package },
]

const MIX_COLORS = {
  tracks: "var(--chart-1)",
  albums: "var(--chart-2)",
  products: "var(--chart-3)",
  tickets: "var(--chart-4)",
}

const STATUS_COLORS = {
  completed: "var(--chart-1)",
  order_placed: "var(--chart-2)",
  pending: "var(--chart-4)",
  refunded: "var(--destructive)",
  failed: "var(--muted-foreground)",
  unknown: "var(--muted-foreground)",
}

function t(key, options = {}) {
  return I18n.t(`sales.${key}`, options)
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0))
}

function formatMoney(amount, currency = "usd") {
  const normalizedCurrency = String(currency || "usd").toUpperCase()

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "CLP" ? 0 : 2,
  }).format(Number(amount || 0))
}

function formatDate(value) {
  if (!value) return t("dashboard.never")

  return new Date(value).toLocaleString()
}

function formatShortDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function defaultDashboardRange() {
  const today = new Date()

  return {
    from: subDays(today, DASHBOARD_RANGE_DAYS - 1),
    to: today,
  }
}

function formatDateInput(value) {
  return format(value, "yyyy-MM-dd")
}

function parseDateInput(value) {
  if (!value) return undefined

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

function searchParamsToRange(searchParams) {
  const from = parseDateInput(searchParams.get("from"))
  const to = parseDateInput(searchParams.get("to"))

  if (!from && !to) return defaultDashboardRange()

  return {
    from: from || to,
    to: to || from,
  }
}

function rangeDays(range) {
  if (!range?.from) return 0

  return differenceInCalendarDays(range.to || range.from, range.from) + 1
}

function rangeLabel(range) {
  if (!range?.from) return t("dashboard.pick_range")
  if (!range.to) return format(range.from, "LLL dd, y")

  return `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`
}

function dashboardPath(range) {
  const params = new URLSearchParams({ tab: "Dashboard" })

  if (range?.from) {
    params.set("from", formatDateInput(range.from))
    params.set("to", formatDateInput(range.to || range.from))
  }

  return `/sales.json?${params.toString()}`
}

function statusVariant(status) {
  return ["paid", "completed", "order_placed"].includes(status) ? "success" : "secondary"
}

function saleTypeLabel(type) {
  return t(`types.${type || "unknown"}`)
}

function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <Receipt className="mb-3 h-8 w-8 text-muted-foreground" />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="rounded-lg border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
  )
}

function DashboardRangeToolbar({
  range,
  setRange,
  pickerOpen,
  setPickerOpen,
  onApply,
  onReset,
  days,
}) {
  return (
    <section className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-medium">{t("dashboard.date_range")}</p>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.date_range_showing", {
            range: rangeLabel(range),
            days: days || rangeDays(range),
          })}
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
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">{t("dashboard.select_report_range")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.calendar_help")}</p>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={range?.from}
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
            />
            <div className="flex items-center justify-between gap-4 border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">{rangeLabel(range)}</span>
              <Button size="sm" onClick={onApply} disabled={!range?.from}>
                {t("dashboard.apply_range")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          {t("dashboard.last_year")}
        </Button>
      </div>
    </section>
  )
}

function TicketEventsCard({ events, summary, currency }) {
  const chartData = events.map((event) => ({
    title: event.title?.length > 18 ? `${event.title.slice(0, 18)}...` : event.title,
    sold_tickets: event.sold_tickets,
    fullTitle: event.title,
  }))

  const chartConfig = {
    sold_tickets: {
      label: t("dashboard.ticket_events.tickets_sold"),
      color: "var(--chart-4)",
    },
  }

  return (
    <Card className="rounded-lg border-border bg-card shadow-sm">
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>{t("dashboard.ticket_events.title")}</CardTitle>
          <CardDescription>{t("dashboard.ticket_events.description")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {formatNumber(summary.tickets_sold_count)} {t("dashboard.ticket_events.tickets_sold")}
          </Badge>
          <Badge variant="outline">
            {formatMoney(summary.ticket_revenue, currency)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0 aspect-auto overflow-hidden">
              <BarChart data={chartData} margin={{ left: 4, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="title" tickLine={false} axisLine={false} minTickGap={18} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_value, payload) => payload?.[0]?.payload?.fullTitle || ""}
                    />
                  }
                />
                <Bar dataKey="sold_tickets" fill="var(--color-sold_tickets)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>

            <div className="divide-y rounded-lg border">
              {events.map((event) => (
                <div key={`${event.id}-${event.currency}`} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(event.sold_tickets)} {t("dashboard.ticket_events.tickets_sold")} - {formatMoney(event.revenue, event.currency)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link to={event.report_path}>
                      {t("dashboard.ticket_events.view_report")}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title={t("dashboard.ticket_events.empty_title")}
            description={t("dashboard.ticket_events.empty_description")}
          />
        )}
      </CardContent>
    </Card>
  )
}

function SalesDashboard({ payload, loading }) {
  if (loading) return <DashboardLoading />
  if (!payload?.dashboard) {
    return (
      <EmptyState
        title={t("dashboard.empty_title")}
        description={t("dashboard.empty_description")}
      />
    )
  }

  const { dashboard, collection = [] } = payload
  const currency = dashboard.summary.primary_currency
  const hasRevenue = dashboard.revenue_series.some((point) => point.total > 0)
  const salesMix = dashboard.sales_mix.filter((entry) => entry.units > 0 || entry.revenue > 0)
  const statusMix = dashboard.product_status_mix.filter((entry) => entry.count > 0)
  const topItems = dashboard.top_items.slice(0, 8)

  const revenueChartConfig = {
    music: {
      label: t("dashboard.charts.music"),
      color: "var(--chart-1)",
    },
    products: {
      label: t("dashboard.charts.products"),
      color: "var(--chart-2)",
    },
    tickets: {
      label: t("dashboard.charts.tickets"),
      color: "var(--chart-4)",
    },
  }

  const topItemsChartConfig = {
    revenue: {
      label: t("dashboard.charts.revenue"),
      color: "var(--chart-3)",
    },
  }

  const topItemsChartData = topItems.map((item) => ({
    title: item.title?.length > 18 ? `${item.title.slice(0, 18)}...` : item.title,
    revenue: item.revenue,
    currency: item.currency,
    fullTitle: item.title,
  }))

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.8fr]">
          <div>
            <p className="text-xs font-medium uppercase text-primary">{t("dashboard.eyebrow")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {t("dashboard.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t("dashboard.description", { days: dashboard.range.days })}
            </p>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">{t("dashboard.latest_sale")}</p>
            <p className="mt-2 text-lg font-semibold">{formatDate(dashboard.summary.latest_sale_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.revenue_by_currency.map((entry) => (
                <Badge key={entry.currency} variant="outline">
                  {formatMoney(entry.amount, entry.currency)} {entry.currency?.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.metrics.gross_revenue")}
          value={formatMoney(dashboard.summary.gross_revenue, currency)}
          description={t("dashboard.metrics.range", { days: dashboard.range.days })}
          icon={CircleDollarSign}
        />
        <MetricCard
          title={t("dashboard.metrics.orders")}
          value={formatNumber(dashboard.summary.orders_count)}
          description={t("dashboard.metrics.music_and_products")}
          icon={ShoppingBag}
        />
        <MetricCard
          title={t("dashboard.metrics.units")}
          value={formatNumber(dashboard.summary.units_sold)}
          description={t("dashboard.metrics.units_description")}
          icon={Package}
        />
        <MetricCard
          title={t("dashboard.metrics.average_order")}
          value={formatMoney(dashboard.summary.average_order_value, currency)}
          description={t("dashboard.metrics.average_order_description")}
          icon={TrendingUp}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("dashboard.metrics.music_revenue")}
          value={formatMoney(dashboard.summary.music_revenue, currency)}
          description={t("dashboard.metrics.music_sales_count", { count: formatNumber(dashboard.summary.music_sales_count) })}
          icon={Disc3}
        />
        <MetricCard
          title={t("dashboard.metrics.product_revenue")}
          value={formatMoney(dashboard.summary.product_revenue, currency)}
          description={t("dashboard.metrics.product_orders_count", { count: formatNumber(dashboard.summary.product_orders_count) })}
          icon={Package}
        />
        <MetricCard
          title={t("dashboard.metrics.ticket_revenue")}
          value={formatMoney(dashboard.summary.ticket_revenue, currency)}
          description={t("dashboard.metrics.tickets_sold_count", { count: formatNumber(dashboard.summary.tickets_sold_count) })}
          icon={Ticket}
        />
        <MetricCard
          title={t("dashboard.metrics.refunds")}
          value={formatNumber(dashboard.summary.refunded_count)}
          description={t("dashboard.metrics.refunds_description")}
          icon={ShoppingBag}
        />
      </section>

      <TicketEventsCard
        events={dashboard.ticket_events || []}
        summary={dashboard.summary}
        currency={currency}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard.charts.revenue_over_time")}</CardTitle>
            <CardDescription>{t("dashboard.charts.revenue_over_time_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasRevenue ? (
              <ChartContainer config={revenueChartConfig} className="h-[320px] w-full min-w-0 aspect-auto overflow-hidden">
                <AreaChart data={dashboard.revenue_series} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="musicRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-music)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--color-music)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="productRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-products)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--color-products)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="ticketRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-tickets)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--color-tickets)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tickFormatter={(value) => formatMoney(value, currency)} tickLine={false} axisLine={false} width={82} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatShortDate(value)}
                        formatter={(value, name) => (
                          <span className="font-medium">
                            {t(`dashboard.charts.${name}`)}: {formatMoney(value, currency)}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area type="monotone" dataKey="music" stackId="revenue" stroke="var(--color-music)" fill="url(#musicRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="products" stackId="revenue" stroke="var(--color-products)" fill="url(#productRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="tickets" stackId="revenue" stroke="var(--color-tickets)" fill="url(#ticketRevenue)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState title={t("dashboard.no_revenue_title")} description={t("dashboard.no_revenue_description")} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard.charts.sales_mix")}</CardTitle>
            <CardDescription>{t("dashboard.charts.sales_mix_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesMix.length > 0 ? (
              <>
                <ChartContainer config={{}} className="h-[260px] w-full min-w-0 aspect-auto overflow-hidden">
                  <PieChart>
                    <Pie data={salesMix} dataKey="units" nameKey="key" innerRadius={58} outerRadius={92} paddingAngle={3}>
                      {salesMix.map((entry) => (
                        <Cell key={entry.key} fill={MIX_COLORS[entry.key] || "var(--muted-foreground)"} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel
                          nameKey="key"
                          formatter={(value, name, item) => (
                            <span className="font-medium">
                              {saleTypeLabel(name)}: {formatNumber(value)} - {formatMoney(item.payload.revenue, currency)}
                            </span>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid gap-2">
                  {salesMix.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MIX_COLORS[entry.key] }} />
                        {saleTypeLabel(entry.key)}
                      </span>
                      <span className="font-medium">{formatNumber(entry.units)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title={t("dashboard.no_mix_title")} description={t("dashboard.no_mix_description")} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard.charts.top_items")}</CardTitle>
            <CardDescription>{t("dashboard.charts.top_items_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {topItemsChartData.length > 0 ? (
              <ChartContainer config={topItemsChartConfig} className="h-[320px] w-full min-w-0 aspect-auto overflow-hidden">
                <BarChart data={topItemsChartData} margin={{ left: 4, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="title" tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis tickFormatter={(value) => formatMoney(value, currency)} tickLine={false} axisLine={false} width={82} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_value, payload) => payload?.[0]?.payload?.fullTitle || ""}
                        formatter={(value, _name, item) => formatMoney(value, item.payload.currency)}
                      />
                    }
                  />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState title={t("dashboard.no_top_items_title")} description={t("dashboard.no_top_items_description")} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard.charts.product_status")}</CardTitle>
            <CardDescription>{t("dashboard.charts.product_status_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {statusMix.length > 0 ? (
              <>
                <ChartContainer config={{}} className="h-[240px] w-full min-w-0 aspect-auto overflow-hidden">
                  <PieChart>
                    <Pie data={statusMix} dataKey="count" nameKey="key" outerRadius={86}>
                      {statusMix.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "var(--muted-foreground)"} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel
                          nameKey="key"
                          formatter={(value, name) => (
                            <span className="font-medium">
                              {t(`statuses.${name}`)}: {formatNumber(value)}
                            </span>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid gap-2">
                  {statusMix.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.key] }} />
                        {t(`statuses.${entry.key}`)}
                      </span>
                      <span className="font-medium">{formatNumber(entry.count)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title={t("dashboard.no_status_title")} description={t("dashboard.no_status_description")} />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{t("dashboard.recent_sales")}</CardTitle>
          <CardDescription>{t("dashboard.recent_sales_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {collection.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {collection.map((sale) => (
                <RecentSaleRow key={sale.id} sale={sale} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("dashboard.no_recent_title")} description={t("dashboard.no_recent_description")} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RecentSaleRow({ sale }) {
  const content = (
    <div className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{saleTypeLabel(sale.type)}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistance(new Date(sale.created_at), new Date(), { addSuffix: true })}
          </span>
        </div>
        <p className="mt-1 truncate font-medium">{sale.title || t("dashboard.untitled_sale")}</p>
        <p className="truncate text-sm text-muted-foreground">
          {sale.buyer_name || sale.buyer_email || t("dashboard.unknown_buyer")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Badge variant={statusVariant(sale.status)}>{sale.status}</Badge>
        <Badge variant="outline">{formatMoney(sale.amount, sale.currency)}</Badge>
      </div>
    </div>
  )

  if (sale.path) {
    return <Link to={sale.path}>{content}</Link>
  }

  return content
}

function SaleItem({ sale }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center space-x-4">
        {sale.type === "Product" ? (
          <Avatar className="shrink-0">
            <AvatarImage src={sale.buyer?.avatar_url} />
            <AvatarFallback>{sale.buyer?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="shrink-0">
            <AvatarImage src={sale.purchased_item?.cover_url} className="object-cover" />
            <AvatarFallback>{sale.purchased_item?.title?.charAt(0) || "T"}</AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium">
            {sale.type === "Product" ? (
              <div className="space-y-2">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <Link
                      to={`/sales/${sale.id}/product_show`}
                      className="truncate text-blue-600 hover:underline"
                    >
                      {item.quantity}x {item.product.title} - {formatMoney(item.price, item.currency)}
                    </Link>

                    {item.service_booking && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <span className="capitalize">{item.service_booking.status}</span>
                        </Badge>
                        <Link
                          to={`/service_bookings/${item.service_booking.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {t("actions.view_booking")}
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="truncate">
                {sale.purchased_item.title} - {formatMoney(sale.purchase.price, sale.currency)}
              </div>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {sale.type === "Product" ? (
              <>{t("buyer")}: {sale.buyer.name} ({sale.buyer.email})</>
            ) : (
              <>{t("buyer")}: {sale.purchase.user.name} ({sale.purchase.user.email})</>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistance(new Date(sale.created_at), new Date(), { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Badge variant={
          sale.type === "Product"
            ? statusVariant(sale.status)
            : statusVariant(sale.purchase.state)
        }>
          {sale.type === "Product" ? sale.status : sale.purchase.state}
        </Badge>
        {sale.type === "Product" && sale.shipping_status && (
          <Badge variant="outline">{sale.shipping_status}</Badge>
        )}
      </div>
    </div>
  )
}

function SalesList({ sales, loading, lastElementRef, emptyTitle, emptyDescription }) {
  return (
    <Card className="rounded-lg border-border bg-card shadow-sm">
      <CardContent className="p-4">
        <ScrollArea className="h-[600px] pr-4">
          {sales.length > 0 || loading ? (
            <div className="space-y-4">
              {sales.map((sale, index) => (
                <div key={sale.id} ref={index === sales.length - 1 ? lastElementRef : null}>
                  <SaleItem sale={sale} />
                </div>
              ))}
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default function MySales() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = React.useState("Dashboard")
  const [dashboardPayload, setDashboardPayload] = React.useState(null)
  const [dashboardLoading, setDashboardLoading] = React.useState(true)
  const [dashboardRange, setDashboardRange] = React.useState(() => searchParamsToRange(searchParams))
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const searchKey = searchParams.toString()
  const appliedDashboardRange = React.useMemo(
    () => searchParamsToRange(new URLSearchParams(searchKey)),
    [searchKey]
  )
  const dashboardRequestPath = React.useMemo(
    () => dashboardPath(appliedDashboardRange),
    [appliedDashboardRange]
  )
  const {
    items: sales,
    loading,
    lastElementRef,
  } = useInfiniteScroll(`/sales.json?tab=${tab}`, {
    enabled: tab !== "Dashboard",
  })

  React.useEffect(() => {
    setDashboardRange(searchParamsToRange(new URLSearchParams(searchKey)))
  }, [searchKey])

  React.useEffect(() => {
    let cancelled = false

    async function fetchDashboard() {
      if (tab !== "Dashboard") return

      setDashboardLoading(true)

      try {
        const response = await get(dashboardRequestPath)
        const payload = await response.json

        if (!cancelled) {
          setDashboardPayload(payload)
        }
      } catch (_error) {
        if (!cancelled) {
          setDashboardPayload(null)
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      cancelled = true
    }
  }, [tab, dashboardRequestPath])

  function applyRange() {
    if (!dashboardRange?.from) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("from", formatDateInput(dashboardRange.from))
    nextParams.set("to", formatDateInput(dashboardRange.to || dashboardRange.from))
    setSearchParams(nextParams, { replace: true })
    setPickerOpen(false)
  }

  function resetRange() {
    const nextRange = defaultDashboardRange()
    setDashboardRange(nextRange)
    setSearchParams(
      {
        from: formatDateInput(nextRange.from),
        to: formatDateInput(nextRange.to),
      },
      { replace: true }
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Tabs value={tab} className="w-full" onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          {SALES_TABS.map((salesTab) => {
            const Icon = salesTab.icon
            return (
              <TabsTrigger key={salesTab.value} value={salesTab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {t(salesTab.labelKey)}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="Dashboard" className="mt-6">
          <DashboardRangeToolbar
            range={dashboardRange}
            setRange={setDashboardRange}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            onApply={applyRange}
            onReset={resetRange}
            days={dashboardPayload?.dashboard?.range?.days}
          />
          <SalesDashboard payload={dashboardPayload} loading={dashboardLoading} />
        </TabsContent>

        <TabsContent value="Album" className="mt-6">
          <SalesList
            sales={sales}
            loading={loading}
            lastElementRef={lastElementRef}
            emptyTitle={t("empty.albums.title")}
            emptyDescription={t("empty.albums.description")}
          />
        </TabsContent>

        <TabsContent value="Track" className="mt-6">
          <SalesList
            sales={sales}
            loading={loading}
            lastElementRef={lastElementRef}
            emptyTitle={t("empty.tracks.title")}
            emptyDescription={t("empty.tracks.description")}
          />
        </TabsContent>

        <TabsContent value="Product" className="mt-6">
          <SalesList
            sales={sales}
            loading={loading}
            lastElementRef={lastElementRef}
            emptyTitle={t("empty.products.title")}
            emptyDescription={t("empty.products.description")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
