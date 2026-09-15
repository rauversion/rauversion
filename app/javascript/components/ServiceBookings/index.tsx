import React from "react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@rails/request.js"
import { useSearchParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceBookingsList } from "./ServiceBookingsList"
import { CalendarDays, Loader2, WalletCards } from "lucide-react"
import I18n from "@/stores/locales"

interface ServiceBooking {
  id: number
  status: string
  created_at: string
  service_product: {
    id: number
    title: string
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
  rating?: number
  feedback?: string
  cancelled_by?: {
    id: number
    name: string
  }
}

export function ServiceBookings() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get("filter") || "all"
  const normalizedFilter = ["all", "customer", "provider"].includes(filter) ? filter : "all"

  const handleFilterChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)

    if (value === "all") {
      nextParams.delete("filter")
    } else {
      nextParams.set("filter", value)
    }

    setSearchParams(nextParams, { replace: false })
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["service_bookings", normalizedFilter],
    queryFn: async () => {
      const response = await get("/service_bookings", {
        query: normalizedFilter === "all" ? {} : { filter: normalizedFilter },
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

  if (error) {
    toast({
      variant: "destructive",
      title: I18n.t("service_bookings.messages.error"),
      description: I18n.t("service_bookings.index.load_error"),
    })
    return null
  }

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="mb-6 border-b border-border pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <WalletCards className="h-3.5 w-3.5" />
              {I18n.t("menu.service_bookings", { defaultValue: I18n.t("service_bookings.index.title") })}
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              {I18n.t("service_bookings.index.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {I18n.t("service_bookings.index.subtitle")}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background/70 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {I18n.t("service_bookings.index.title")}
            </div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {(data?.service_bookings || []).length}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={normalizedFilter} className="w-full" onValueChange={handleFilterChange}>
        <TabsList className="mb-5">
          <TabsTrigger value="all">{I18n.t("service_bookings.index.all")}</TabsTrigger>
          <TabsTrigger value="customer">{I18n.t("service_bookings.index.as_customer")}</TabsTrigger>
          <TabsTrigger value="provider">{I18n.t("service_bookings.index.as_provider")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ServiceBookingsList bookings={data?.service_bookings || []} />
        </TabsContent>
        <TabsContent value="customer">
          <ServiceBookingsList bookings={data?.service_bookings || []} />
        </TabsContent>
        <TabsContent value="provider">
          <ServiceBookingsList bookings={data?.service_bookings || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
