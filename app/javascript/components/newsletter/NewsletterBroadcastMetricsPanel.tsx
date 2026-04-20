import React from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { BarChart3, MousePointerClick, PieChart as PieChartIcon, TrendingUp } from "lucide-react"

import type { NewsletterBroadcastRecord } from "@/lib/newsletter/types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatDateLabel(value: string) {
  if (!value) return "—"

  return new Date(value).toLocaleDateString("es-CL", {
    month: "short",
    day: "numeric",
  })
}

function truncateUrl(value: string) {
  if (value.length <= 48) return value
  return `${value.slice(0, 48)}…`
}

function buildChartConfig(items: Array<{ key: string; label: string; fill: string }>) {
  return items.reduce<Record<string, { label: string; color: string }>>((memo, item) => {
    memo[item.key] = {
      label: item.label,
      color: item.fill,
    }
    return memo
  }, {})
}

export default function NewsletterBroadcastMetricsPanel({
  broadcast,
}: {
  broadcast: NewsletterBroadcastRecord
}) {
  const metrics = broadcast.metrics
  const sentRecipients = broadcast.sentRecipients

  const deliveryChartConfig = React.useMemo(
    () => buildChartConfig(metrics.deliveryBreakdown),
    [metrics.deliveryBreakdown]
  )

  const engagementChartConfig = React.useMemo(
    () => buildChartConfig(metrics.engagementBreakdown),
    [metrics.engagementBreakdown]
  )

  const activityChartConfig = React.useMemo(
    () => ({
      opens: {
        label: "Aperturas",
        color: "var(--chart-1)",
      },
      clicks: {
        label: "Clicks",
        color: "var(--chart-2)",
      },
    }),
    []
  )

  if (sentRecipients <= 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Las métricas aparecerán después del primer envío exitoso.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tasa de apertura</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatPercent(metrics.openRate)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.uniqueOpenRecipients} destinatarios únicos abrieron el correo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tasa de click</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatPercent(metrics.clickRate)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.uniqueClickRecipients} destinatarios únicos hicieron click
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Aperturas Totales</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.totalOpens}</div>
            <p className="text-xs text-muted-foreground">
              Click-to-open: {formatPercent(metrics.clickToOpenRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Clicks totales</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Enviados: {broadcast.sentRecipients} · Fallidos: {broadcast.failedRecipients}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entrega</CardTitle>
            <CardDescription>Cómo terminó el envío de esta campaña.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.deliveryBreakdown.length > 0 ? (
              <>
                <ChartContainer config={deliveryChartConfig} className="h-[260px] w-full min-w-0 aspect-auto overflow-hidden">
                  <PieChart>
                    <Pie
                      data={metrics.deliveryBreakdown}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      labelLine={false}
                      label={({ value }) => value}
                    >
                      {metrics.deliveryBreakdown.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  </PieChart>
                </ChartContainer>

                <div className="mt-4 grid gap-2">
                  {metrics.deliveryBreakdown.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span>{entry.label}</span>
                      </div>
                      <Badge variant="outline">{entry.value}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Todavía no hay datos de entrega.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interacción</CardTitle>
            <CardDescription>Quién abrió, quién hizo click y quién no interactuó.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.engagementBreakdown.length > 0 ? (
              <>
                <ChartContainer config={engagementChartConfig} className="h-[260px] w-full min-w-0 aspect-auto overflow-hidden">
                  <PieChart>
                    <Pie
                      data={metrics.engagementBreakdown}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      labelLine={false}
                      label={({ value }) => value}
                    >
                      {metrics.engagementBreakdown.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  </PieChart>
                </ChartContainer>

                <div className="mt-4 grid gap-2">
                  {metrics.engagementBreakdown.map((entry) => (
                    <div key={entry.key} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span>{entry.label}</span>
                      </div>
                      <Badge variant="outline">{entry.value}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Todavía no hay datos de interacción.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Actividad</CardTitle>
            <CardDescription>Aperturas y clicks agrupados por fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.activitySeries.length > 0 ? (
              <ChartContainer config={activityChartConfig} className="h-[280px] w-full min-w-0 aspect-auto overflow-hidden">
                <BarChart data={metrics.activitySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatDateLabel(String(value))}
                      />
                    }
                  />
                  <Bar dataKey="opens" fill="var(--color-opens)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Aún no hay actividad registrada.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links principales</CardTitle>
            <CardDescription>Los enlaces con más clicks de esta campaña.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.topLinks.length > 0 ? (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link</TableHead>
                      <TableHead className="w-[96px] text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.topLinks.map((link) => (
                      <TableRow key={link.url}>
                        <TableCell className="max-w-[320px]">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-primary underline-offset-4 hover:underline"
                            title={link.url}
                          >
                            {truncateUrl(link.url)}
                          </a>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {link.uniqueClicks} clicks únicos
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{link.clicks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Todavía no hay clicks registrados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
