import React from "react"
import { useQuery } from "@tanstack/react-query"
import { get } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceBookingsList } from "./ServiceBookingsList"
import { Loader2 } from "lucide-react"

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
  const [filter, setFilter] = React.useState("all")

  const { data, isLoading, error } = useQuery({
    queryKey: ["service_bookings", filter],
    queryFn: async () => {
      const response = await get("/service_bookings", {
        query: { filter },
        responseKind: "json",
      })
      return response.json
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load service bookings",
    })
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Service Bookings</h1>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="customer">As Customer</TabsTrigger>
          <TabsTrigger value="provider">As Provider</TabsTrigger>
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
