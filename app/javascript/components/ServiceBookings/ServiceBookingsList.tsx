import React from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { MessageCircle } from "lucide-react"

interface Conversation {
  id: number
  subject: string
  status: string
  created_at: string
}

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
  conversations: Conversation[]
}

interface Props {
  bookings: ServiceBooking[]
}

const statusColors = {
  pending_confirmation: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  scheduled: "bg-purple-100 text-purple-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
}

const statusLabels = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export function ServiceBookingsList({ bookings }: Props) {
  const navigate = useNavigate()

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    return statusLabels[status as keyof typeof statusLabels] || status
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bookings && bookings.map((booking) => (
        <Card key={booking.id} className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/service_bookings/${booking.id}`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {booking.service_product.title}
            </CardTitle>
            <Badge className={getStatusColor(booking.status)}>
              {getStatusLabel(booking.status)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div>
                <p className="text-sm font-medium">Provider</p>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={booking.provider.avatar_url} />
                    <AvatarFallback>{booking.provider?.name}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {booking.provider.name}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Customer</p>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={booking.customer.avatar_url} />
                    <AvatarFallback>{booking.customer.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {booking.customer.name}
                  </span>
                </div>
              </div>
            </div>

            {booking.metadata.scheduled_date && (
              <div className="mt-2">
                <p className="text-sm font-medium">Scheduled for</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(booking.metadata.scheduled_date), "PPP")}
                  {booking.metadata.scheduled_time && (
                    <> at {booking.metadata.scheduled_time}</>
                  )}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </div>

              <div className="mt-4">
                {booking.conversations && booking.conversations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {booking.conversations.map((conversation) => (
                      <Link
                        key={conversation.id}
                        to={`/conversations/${conversation.id}`}
                        className="text-xs underline text-blue-600 hover:text-blue-800"
                        onClick={e => e.stopPropagation()}
                      >
                        <MessageCircle className="inline mr-1" />
                        {"View Conversation"}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
