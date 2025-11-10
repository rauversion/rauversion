import React from "react"
import { useParams } from "react-router-dom"
import { get } from '@rails/request.js'
import I18n from '@/stores/locales'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, Calendar, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const COLORS = {
  paid: "hsl(142, 76%, 36%)",
  pending: "hsl(48, 96%, 53%)",
  refunded: "hsl(0, 84%, 60%)",
}

const chartConfig = {
  paid: {
    label: "Paid",
    color: COLORS.paid,
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

export default function Reports() {
  const { slug } = useParams()
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState({
    paid: { count: 0, total: 0 },
    pending: { count: 0, total: 0 },
    refunded: { count: 0, total: 0 },
  })
  const [event, setEvent] = React.useState(null)

  React.useEffect(() => {
    fetchReportsData()
  }, [slug])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      // For now, we'll use mock data since the backend endpoint doesn't exist yet
      // TODO: Replace with actual API call when backend is ready
      // const response = await get(`/events/${slug}/reports`)
      // const data = await response.json
      
      // Mock data for demonstration
      setTimeout(() => {
        setStats({
          paid: { count: 45, total: 4500 },
          pending: { count: 12, total: 1200 },
          refunded: { count: 3, total: 300 },
        })
        setEvent({
          title: "Demo Event",
          event_start: new Date().toISOString(),
          event_ends: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error("Error fetching reports data:", error)
      setLoading(false)
    }
  }

  const totalRevenue = stats.paid.total + stats.pending.total
  const totalOrders = stats.paid.count + stats.pending.count + stats.refunded.count

  const barChartData = [
    { name: I18n.t("events.edit.reports.status.paid"), value: stats.paid.total, fill: COLORS.paid },
    { name: I18n.t("events.edit.reports.status.pending"), value: stats.pending.total, fill: COLORS.pending },
    { name: I18n.t("events.edit.reports.status.refunded"), value: stats.refunded.total, fill: COLORS.refunded },
  ]

  const pieChartData = [
    { name: I18n.t("events.edit.reports.status.paid"), value: stats.paid.count, fill: COLORS.paid },
    { name: I18n.t("events.edit.reports.status.pending"), value: stats.pending.count, fill: COLORS.pending },
    { name: I18n.t("events.edit.reports.status.refunded"), value: stats.refunded.count, fill: COLORS.refunded },
  ]

  const isEventStarted = event && new Date(event.event_start) <= new Date()
  const isEventEnded = event && new Date(event.event_ends) <= new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{I18n.t("events.edit.reports.loading")}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{I18n.t("events.edit.reports.title")}</h2>
        <p className="text-muted-foreground">{I18n.t("events.edit.reports.description")}</p>
      </div>

      {/* Event Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {I18n.t("events.edit.reports.total_orders")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {I18n.t("events.edit.reports.total_orders_description")}
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
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.paid.total.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${stats.pending.total.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${stats.refunded.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.refunded.count} {I18n.t("events.edit.reports.orders")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {I18n.t("events.edit.reports.total_revenue")}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {I18n.t("events.edit.reports.total_revenue_description")}
          </p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart - Revenue by Status */}
        <Card>
          <CardHeader>
            <CardTitle>{I18n.t("events.edit.reports.charts.revenue_by_status")}</CardTitle>
            <CardDescription>
              {I18n.t("events.edit.reports.charts.revenue_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
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
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
