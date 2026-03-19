import React from "react"
import { Link, useSearchParams } from "react-router-dom"
import type { DateRange } from "react-day-picker"
import { format, isValid, parseISO, subDays } from "date-fns"
import { adminGetJson } from "./api"
import type { ListeningDashboardData } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CalendarIcon, Disc3, Globe2, Headphones, ListMusic, RotateCcw, Users } from "lucide-react"
import { cn } from "@/lib/utils"

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0))
}

function formatDate(value?: string | null) {
  if (!value) return "No listening events yet"
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
  plays_count: {
    label: "Plays",
    color: "var(--chart-1)",
  },
}

export default function AdminListeningPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = React.useState<ListeningDashboardData | null>(null)
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
        const payload = await adminGetJson<ListeningDashboardData>(`/api/admin/listening${searchKey ? `?${searchKey}` : ""}`)
        setData(payload)
        setRange({
          from: parseDateInput(payload.range.from),
          to: parseDateInput(payload.range.to),
        })
      } catch (error: any) {
        toast({
          title: "Listening dashboard failed",
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
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading listening dashboard...</div>
  }

  if (!data) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Listening dashboard unavailable.</div>
  }

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
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Listening</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Top listening events, listener accounts and playlist consumption.
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { label: "Tracked countries", value: data.summary.countries_count },
                { label: "Accounts", value: data.summary.accounts_count },
                { label: "Playlists", value: data.summary.playlists_count },
              ].map((entry) => (
                <div key={entry.label} className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{entry.label}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatNumber(entry.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-background/70 p-6">
            <p className="text-sm text-muted-foreground">Latest play</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatDate(data.summary.latest_play_at)}</p>
            <div className="mt-6 rounded-2xl border border-border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total listens</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatNumber(data.summary.total_plays)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total plays", value: data.summary.total_plays, icon: Headphones },
          { label: "Accounts", value: data.summary.accounts_count, icon: Users },
          { label: "Tracks", value: data.summary.tracks_count, icon: Disc3 },
          { label: "Playlists", value: data.summary.playlists_count, icon: ListMusic },
          { label: "Countries", value: data.summary.countries_count, icon: Globe2 },
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
            <CardTitle>Daily listening volume</CardTitle>
          </CardHeader>
          <CardContent>
            {data.plays_series.every((entry) => entry.plays_count === 0) ? (
              <EmptyState label="No listening activity in the selected range." />
            ) : (
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <BarChart data={data.plays_series}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatNumber(Number(value))}
                        labelFormatter={(_value, payload) => payload?.[0]?.payload?.label || ""}
                      />
                    }
                  />
                  <Bar dataKey="plays_count" fill="var(--color-plays_count)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Top 30 most listened tracks</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_tracks.length === 0 ? (
              <EmptyState label="No listening activity yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Track</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead className="text-right">Plays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top_tracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {track.track_path ? (
                            <Link to={track.track_path} className="font-medium text-foreground hover:text-primary hover:underline">
                              {track.title}
                            </Link>
                          ) : (
                            <span className="font-medium text-foreground">{track.title}</span>
                          )}
                          {track.private && <Badge variant="secondary">Private</Badge>}
                          {track.missing && <Badge variant="secondary">Deleted</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {track.artist_path ? (
                          <Link to={track.artist_path} className="text-foreground/80 hover:text-primary hover:underline">
                            {track.artist_name}
                          </Link>
                        ) : (
                          <span className="text-foreground/80">{track.artist_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatNumber(track.plays_count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>By country</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top_countries.length === 0 ? (
              <EmptyState label="No country data yet." />
            ) : (
              data.top_countries.map((country) => (
                <div key={country.country} className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {country.flag_url ? (
                      <img src={country.flag_url} alt={country.country} className="h-4 w-6 rounded-sm border border-border object-cover" />
                    ) : (
                      <div className="h-4 w-6 rounded-sm border border-border bg-muted" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{country.country}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(country.accounts_count)} accounts</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">{formatNumber(country.plays_count)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>By account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top_accounts.length === 0 ? (
              <EmptyState label="No signed-in listeners yet." />
            ) : (
              data.top_accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {account.user_path ? (
                          <Link to={account.user_path} className="font-medium text-foreground hover:text-primary hover:underline">
                            {account.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">{account.name}</span>
                        )}
                        {account.missing && <Badge variant="secondary">Deleted</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatNumber(account.tracks_count)} tracks · {formatNumber(account.playlists_count)} playlists
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{formatNumber(account.plays_count)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>By playlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top_playlists.length === 0 ? (
              <EmptyState label="No playlist listening yet." />
            ) : (
              data.top_playlists.map((playlist) => (
                <div key={playlist.id} className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        {playlist.playlist_path ? (
                          <Link to={playlist.playlist_path} className="font-medium text-foreground hover:text-primary hover:underline">
                            {playlist.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">{playlist.title}</span>
                        )}
                        {playlist.private && <Badge variant="secondary">Private</Badge>}
                        {playlist.missing && <Badge variant="secondary">Deleted</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{playlist.playlist_type}</p>
                      {playlist.owner_path ? (
                        <Link to={playlist.owner_path} className="mt-2 inline-flex text-sm text-foreground/80 hover:text-primary hover:underline">
                          {playlist.owner_name}
                        </Link>
                      ) : (
                        <p className="mt-2 text-sm text-foreground/80">{playlist.owner_name}</p>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-foreground">{formatNumber(playlist.plays_count)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
