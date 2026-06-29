import React from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { get } from "@rails/request.js"
import { CalendarDays, Loader2, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import I18n from "@/stores/locales"

const currency = (amount, code = "clp") => {
  const value = Number(amount || 0)
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: code.toUpperCase(),
    maximumFractionDigits: code.toLowerCase() === "clp" ? 0 : 2,
  })
}

export function ServiceBookingProposals() {
  const { data, isLoading } = useQuery({
    queryKey: ["service_booking_proposals"],
    queryFn: async () => {
      const response = await get("/service_booking_proposals.json", {
        responseKind: "json",
      })
      return response.json
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const proposals = data?.service_booking_proposals || []

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{I18n.t("service_booking_proposals.index.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {I18n.t("service_booking_proposals.index.subtitle")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/service_bookings">{I18n.t("service_booking_proposals.index.view_bookings")}</Link>
        </Button>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {I18n.t("service_booking_proposals.index.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-xl">{proposal.event_name}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {proposal.event_date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[proposal.venue_name, proposal.city].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
                <Badge>{I18n.t(`service_booking_proposals.status.${proposal.status}`)}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm">
                  <div className="font-semibold">{currency(proposal.proposed_amount, proposal.currency)}</div>
                  <div className="text-muted-foreground">
                    {I18n.t("service_booking_proposals.labels.with_artist", {
                      artist: proposal.artist.name,
                    })}
                  </div>
                </div>
                <Button asChild>
                  <Link to={`/service_booking_proposals/${proposal.id}`}>
                    {I18n.t("service_booking_proposals.index.open")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
