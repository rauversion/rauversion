import React from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScheduleForm } from "./ScheduleForm"
import { FeedbackForm } from "./FeedbackForm"


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
    description: string
    price: number
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
  actions: {
    can_confirm: boolean
    can_schedule: boolean
    can_complete: boolean
    can_cancel: boolean
    can_give_feedback: boolean
  }
  conversations: Conversation[]
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

export function ServiceBookingDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: booking, isLoading } = useQuery<{ service_booking: ServiceBooking }>({
    queryKey: ["service_booking", id],
    queryFn: async () => {
      const response = await get(`/service_bookings/${id}`, {
        responseKind: "json",
      })
      return response.json
    },
  })

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await patch(`/service_bookings/${id}/confirm`, {
        responseKind: "json",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
      toast({
        title: "Success",
        description: "Booking confirmed successfully",
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to confirm booking",
      })
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      await patch(`/service_bookings/${id}/complete`, {
        responseKind: "json",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
      toast({
        title: "Success",
        description: "Service marked as completed",
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete service",
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      await patch(`/service_bookings/${id}/cancel`, {
        body: { cancellation_reason: reason },
        responseKind: "json",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel booking",
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!booking) return null

  const { service_booking } = booking

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{service_booking.service_product.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {format(new Date(service_booking.created_at), "PPP")}
            </p>
          </div>
          <Badge
            className={
              statusColors[service_booking.status as keyof typeof statusColors]
            }
          >
            {statusLabels[service_booking.status as keyof typeof statusLabels]}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">

            {service_booking.conversations && service_booking.conversations.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Conversations</h3>
                <div className="flex flex-col gap-2">
                  {service_booking.conversations.map((conversation) => (
                    <a
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                      className="text-xs underline text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {conversation.subject || "View Conversation"}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium mb-2">Provider</h3>
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={service_booking.provider.avatar_url} />
                    <AvatarFallback>
                      {service_booking.provider.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{service_booking.provider.name}</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Customer</h3>
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={service_booking.customer.avatar_url} />
                    <AvatarFallback>
                      {service_booking.customer.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{service_booking.customer.name}</span>
                </div>
              </div>
            </div>

            {service_booking.metadata.scheduled_date && (
              <div>
                <h3 className="font-medium mb-2">Schedule Details</h3>
                <p>
                  Date:{" "}
                  {format(
                    new Date(service_booking.metadata.scheduled_date),
                    "PPP"
                  )}
                </p>
                {service_booking.metadata.scheduled_time && (
                  <p>Time: {service_booking.metadata.scheduled_time}</p>
                )}
                {service_booking.metadata.timezone && (
                  <p>Timezone: {service_booking.metadata.timezone}</p>
                )}
                {service_booking.metadata.meeting_link && (
                  <p>
                    Meeting Link:{" "}
                    <a
                      href={service_booking.metadata.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </p>
                )}
                {service_booking.metadata.meeting_location && (
                  <p>Location: {service_booking.metadata.meeting_location}</p>
                )}
              </div>
            )}

            {service_booking.metadata.special_requirements && (
              <div>
                <h3 className="font-medium mb-2">Special Requirements</h3>
                <p>{service_booking.metadata.special_requirements}</p>
              </div>
            )}

            {service_booking.metadata.provider_notes && (
              <div>
                <h3 className="font-medium mb-2">Provider Notes</h3>
                <p>{service_booking.metadata.provider_notes}</p>
              </div>
            )}

            {service_booking.cancelled_by && (
              <div>
                <h3 className="font-medium mb-2">Cancellation Details</h3>
                <p>
                  Cancelled by: {service_booking.cancelled_by.name}
                  {service_booking.metadata.cancellation_reason && (
                    <>
                      <br />
                      Reason: {service_booking.metadata.cancellation_reason}
                    </>
                  )}
                </p>
              </div>
            )}

            {service_booking.rating && (
              <div>
                <h3 className="font-medium mb-2">Customer Feedback</h3>
                <p>Rating: {service_booking.rating}/5</p>
                {service_booking.feedback && <p>{service_booking.feedback}</p>}
              </div>
            )}

            <div className="flex gap-4 mt-4">
              {service_booking.actions.can_confirm && (
                <Button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirm Booking
                </Button>
              )}

              {service_booking.actions.can_schedule && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Schedule Service</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Service</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm
                      bookingId={service_booking.id}
                      onSuccess={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["service_booking", id],
                        })
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {service_booking.actions.can_complete && (
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Mark as Completed
                </Button>
              )}

              {service_booking.actions.can_give_feedback && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Give Feedback</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Service Feedback</DialogTitle>
                    </DialogHeader>
                    <FeedbackForm
                      bookingId={service_booking.id}
                      onSuccess={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["service_booking", id],
                        })
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {service_booking.actions.can_cancel && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = window.prompt("Please provide a reason for cancellation")
                    if (reason) {
                      cancelMutation.mutate(reason)
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
