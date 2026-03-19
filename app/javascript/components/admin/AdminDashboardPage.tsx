import React from "react"
import { Link } from "react-router-dom"
import { adminGetJson } from "./api"
import type { CommerceDashboardData } from "./types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpRight, Package2, Receipt, Users } from "lucide-react"

function formatMoney(amount: number, currency: string) {
  const normalizedCurrency = (currency || "USD").toUpperCase()
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "CLP" ? 0 : 2,
  }).format(Number(amount || 0))
}

function formatDate(value?: string | null) {
  if (!value) return "No sales yet"
  return new Date(value).toLocaleString()
}

function statusTone(status?: string) {
  switch (status) {
    case "completed":
    case "delivered":
      return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "processing":
    case "shipped":
    case "order_placed":
      return "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "refunded":
      return "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
    default:
      return "border border-border bg-muted text-muted-foreground"
  }
}

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState<CommerceDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const payload = await adminGetJson<CommerceDashboardData>("/api/admin/dashboard")
        setData(payload)
      } catch (error: any) {
        toast({
          title: "Commerce dashboard failed",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [toast])

  if (loading) {
    return <div className="rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-sm">Loading commerce dashboard...</div>
  }

  if (!data) {
    return <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 text-destructive">Dashboard unavailable.</div>
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-muted shadow-xl">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Commerce</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Global product sales, sellers and latest transactions.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.paid_revenue_by_currency.map((entry) => (
                <div key={`paid-${entry.currency}`} className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Paid GMV</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatMoney(entry.amount, entry.currency)}</p>
                  <p className="text-xs text-muted-foreground">{entry.currency}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-background/70 p-6">
            <p className="text-sm text-muted-foreground">Latest sale</p>
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
          { label: "Paid orders", value: data.summary.paid_orders, icon: Receipt },
          { label: "Items sold", value: data.summary.items_sold, icon: Package2 },
          { label: "Products sold", value: data.summary.products_sold, icon: ArrowUpRight },
          { label: "Active sellers", value: data.summary.active_sellers, icon: Users },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="rounded-[1.75rem] border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-card-foreground">{metric.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.top_products.map((product) => (
              <div key={`${product.id}-${product.currency}`} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {product.product_path ? (
                        <Link to={product.product_path} className="font-medium text-foreground hover:text-primary hover:underline">
                          {product.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{product.title}</span>
                      )}
                      {product.archived && <Badge variant="secondary">Archived</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {product.category} · {product.product_type}
                    </p>
                    {product.seller_path ? (
                      <Link to={product.seller_path} className="mt-2 inline-flex text-sm text-foreground/80 hover:text-primary hover:underline">
                        {product.seller_name}
                      </Link>
                    ) : (
                      <p className="mt-2 text-sm text-foreground/80">{product.seller_name}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{product.units_sold}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">units</p>
                    <p className="mt-2 text-sm font-medium text-foreground/80">{formatMoney(product.revenue, product.currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Top sellers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.top_sellers.map((seller) => (
              <div key={`${seller.id}-${seller.currency}`} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {seller.seller_path ? (
                      <Link to={seller.seller_path} className="font-medium text-foreground hover:text-primary hover:underline">
                        {seller.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{seller.name}</span>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {seller.orders_count} orders · {seller.products_count} products
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{seller.units_sold}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">units</p>
                    <p className="mt-2 text-sm font-medium text-foreground/80">{formatMoney(seller.revenue, seller.currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Winning categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top_categories.map((category) => (
              <div key={`${category.category}-${category.currency}`} className="flex items-center justify-between rounded-2xl border border-border bg-background/60 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{category.category}</p>
                  <p className="text-sm text-muted-foreground">{category.orders_count} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{category.units_sold} units</p>
                  <p className="text-sm text-foreground/80">{formatMoney(category.revenue, category.currency)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Latest sold items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.product_path ? (
                            <Link to={item.product_path} className="font-medium text-foreground hover:text-primary hover:underline">
                              {item.title}
                            </Link>
                          ) : (
                            <span className="font-medium text-foreground">{item.title}</span>
                          )}
                          {item.archived && <Badge variant="secondary">Archived</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.category} · qty {item.quantity} · {formatDate(item.sold_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.seller_path ? (
                        <Link to={item.seller_path} className="text-foreground/80 hover:text-primary hover:underline">
                          {item.seller_name}
                        </Link>
                      ) : (
                        item.seller_name
                      )}
                    </TableCell>
                    <TableCell>
                      {item.buyer_path ? (
                        <Link to={item.buyer_path} className="text-foreground/80 hover:text-primary hover:underline">
                          {item.buyer_name || item.buyer_email}
                        </Link>
                      ) : (
                        item.buyer_name || item.buyer_email
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(item.purchase_status)}`}>
                          {item.purchase_status || "unknown"}
                        </span>
                        {item.shipping_status && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(item.shipping_status)}`}>
                            {item.shipping_status}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatMoney(item.item_revenue, item.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
