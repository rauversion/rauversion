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
import { FileSignature, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScheduleForm } from "./ScheduleForm"
import { FeedbackForm } from "./FeedbackForm"
import I18n from "@/stores/locales"


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
    service_kind?: string
    category?: string
    booking_mode?: string
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
  payment?: {
    status: string
    refund_status: string
    currency: string
    subtotal_amount?: number
    total_amount?: number
    deposit_amount?: number
    balance_due_amount?: number
    checkout_provider?: string
    payment_intent_id?: string
    payment_session_id?: string
    refund_id?: string
    refunded_at?: string
    deposit_status?: string
    balance_status?: string
    deposit_paid_at?: string
    deposit_confirmed_at?: string
    balance_paid_at?: string
    balance_confirmed_at?: string
    platform_fee_rate?: number
    platform_fee_amount?: number
    artist_payout_amount?: number
    tracking_notes?: string
  }
  contract?: {
    status: string
    signed_at?: string
    agreement_snapshot?: Record<string, any>
    proposal_id?: number
  }
  venue?: {
    starts_at?: string
    ends_at?: string
    name?: string
    address?: string
    city?: string
    country?: string
  }
  cancelled_by?: {
    id: number
    name: string
  }
  actions: {
    can_confirm: boolean
    can_schedule: boolean
    can_complete: boolean
    can_cancel: boolean
    can_refund: boolean
    can_mark_deposit_paid: boolean
    can_confirm_deposit: boolean
    can_mark_balance_paid: boolean
    can_confirm_balance: boolean
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
  refunded: "bg-muted text-foreground",
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
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.confirm.success"),
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.confirm.error"),
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
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.complete.success"),
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.complete.error"),
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
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.cancel.success"),
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.cancel.error"),
      })
    },
  })

  const refundMutation = useMutation({
    mutationFn: async () => {
      await patch(`/service_bookings/${id}/refund`, {
        responseKind: "json",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
      toast({
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.refund.success"),
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.refund.error"),
      })
    },
  })

  const paymentActionMutation = useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
      await patch(`/service_bookings/${id}/${action}`, {
        responseKind: "json",
        body: notes ? { notes } : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
      toast({
        title: I18n.t("service_bookings.messages.success"),
        description: I18n.t("service_bookings.payment_tracking.success"),
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.payment_tracking.error"),
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
  const statusLabel = I18n.t(`service_bookings.status.${service_booking.status}`, {
    defaultValue: service_booking.status,
  })

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{service_booking.service_product.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {I18n.t("service_bookings.labels.created_on", {
                date: format(new Date(service_booking.created_at), "PPP"),
              })}
            </p>
          </div>
          <Badge
            className={
              statusColors[service_booking.status as keyof typeof statusColors]
            }
          >
            {statusLabel}
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">

            {service_booking.conversations && service_booking.conversations.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.labels.conversations")}</h3>
                <div className="flex flex-col gap-2">
                  {service_booking.conversations.map((conversation) => (
                    <a
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                      className="text-xs underline text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {conversation.subject || I18n.t("service_bookings.labels.view_conversation")}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.labels.provider")}</h3>
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
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.labels.customer")}</h3>
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
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.labels.schedule_details")}</h3>
                <p>
                  {I18n.t("service_bookings.schedule_modal.date")}:{" "}
                  {format(
                    new Date(service_booking.metadata.scheduled_date),
                    "PPP"
                  )}
                </p>
                {service_booking.metadata.scheduled_time && (
                  <p>{I18n.t("service_bookings.schedule_modal.time")}: {service_booking.metadata.scheduled_time}</p>
                )}
                {service_booking.metadata.timezone && (
                  <p>{I18n.t("service_bookings.schedule_modal.timezone")}: {service_booking.metadata.timezone}</p>
                )}
                {service_booking.metadata.meeting_link && (
                  <p>
                    {I18n.t("service_bookings.schedule_modal.meeting_link")}:{" "}
                    <a
                      href={service_booking.metadata.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {I18n.t("service_bookings.index.online_meeting")}
                    </a>
                  </p>
                )}
                {service_booking.metadata.meeting_location && (
                  <p>{I18n.t("service_bookings.labels.location")}: {service_booking.metadata.meeting_location}</p>
                )}
              </div>
            )}

            {service_booking.payment && (
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.payment.title")}</h3>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <p>{I18n.t("service_bookings.payment.status")}: {service_booking.payment.status}</p>
                  <p>{I18n.t("service_bookings.payment.refund")}: {service_booking.payment.refund_status}</p>
                  {service_booking.payment.deposit_status && (
                    <p>{I18n.t("service_bookings.payment.deposit_status")}: {I18n.t(`service_bookings.payment_statuses.${service_booking.payment.deposit_status}`)}</p>
                  )}
                  {service_booking.payment.balance_status && (
                    <p>{I18n.t("service_bookings.payment.balance_status")}: {I18n.t(`service_bookings.payment_statuses.${service_booking.payment.balance_status}`)}</p>
                  )}
                  {service_booking.payment.total_amount && (
                    <p>
                      {I18n.t("service_bookings.payment.total")}:{" "}
                      {Number(service_booking.payment.total_amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: (service_booking.payment.currency || "usd").toUpperCase(),
                      })}
                    </p>
                  )}
                  {service_booking.payment.deposit_amount && (
                    <p>
                      {I18n.t("service_bookings.payment.deposit")}:{" "}
                      {Number(service_booking.payment.deposit_amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: (service_booking.payment.currency || "usd").toUpperCase(),
                      })}
                    </p>
                  )}
                  {service_booking.payment.balance_due_amount && (
                    <p>
                      {I18n.t("service_bookings.payment.balance")}:{" "}
                      {Number(service_booking.payment.balance_due_amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: (service_booking.payment.currency || "usd").toUpperCase(),
                      })}
                    </p>
                  )}
                  {service_booking.payment.platform_fee_amount && (
                    <p>
                      {I18n.t("service_bookings.payment.artist_fee")}:{" "}
                      {Number(service_booking.payment.platform_fee_amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: (service_booking.payment.currency || "usd").toUpperCase(),
                      })}
                    </p>
                  )}
                  {service_booking.payment.artist_payout_amount && (
                    <p>
                      {I18n.t("service_bookings.payment.artist_payout")}:{" "}
                      {Number(service_booking.payment.artist_payout_amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: (service_booking.payment.currency || "usd").toUpperCase(),
                      })}
                    </p>
                  )}
                  {service_booking.payment.checkout_provider && (
                    <p>{I18n.t("service_bookings.payment.provider")}: {service_booking.payment.checkout_provider}</p>
                  )}
                  {service_booking.payment.payment_intent_id && (
                    <p className="break-all">{I18n.t("service_bookings.payment.payment_intent")}: {service_booking.payment.payment_intent_id}</p>
                  )}
                </div>
              </div>
            )}

            {service_booking.contract && service_booking.contract.status !== "not_generated" && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  <FileSignature className="h-4 w-4" />
                  {I18n.t("service_bookings.contract.title")}
                </h3>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <p>{I18n.t("service_bookings.contract.status")}: {I18n.t(`service_bookings.contract_status.${service_booking.contract.status}`)}</p>
                  {service_booking.contract.signed_at && (
                    <p>{I18n.t("service_bookings.contract.signed_at")}: {format(new Date(service_booking.contract.signed_at), "PPP")}</p>
                  )}
                  {service_booking.contract.proposal_id && (
                    <p>
                      {I18n.t("service_bookings.contract.proposal")}:{" "}
                      <a className="text-blue-600 underline" href={`/service_booking_proposals/${service_booking.contract.proposal_id}`}>
                        #{service_booking.contract.proposal_id}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {service_booking.metadata.special_requirements && (
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.show.customer_info.special_requirements")}</h3>
                <p>{service_booking.metadata.special_requirements}</p>
              </div>
            )}

            {service_booking.metadata.provider_notes && (
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.index.provider_notes")}</h3>
                <p>{service_booking.metadata.provider_notes}</p>
              </div>
            )}

            {service_booking.cancelled_by && (
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.labels.cancellation_details")}</h3>
                <p>
                  {I18n.t("service_bookings.labels.cancelled_by")}: {service_booking.cancelled_by.name}
                  {service_booking.metadata.cancellation_reason && (
                    <>
                      <br />
                      {I18n.t("service_bookings.labels.reason")}: {service_booking.metadata.cancellation_reason}
                    </>
                  )}
                </p>
              </div>
            )}

            {service_booking.rating && (
              <div>
                <h3 className="font-medium mb-2">{I18n.t("service_bookings.feedback_form.feedback")}</h3>
                <p>{I18n.t("service_bookings.feedback_form.rating")}: {service_booking.rating}/5</p>
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
                  {I18n.t("service_bookings.show.confirm_button")}
                </Button>
              )}

              {service_booking.actions.can_schedule && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>{I18n.t("service_bookings.show.schedule_button")}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{I18n.t("service_bookings.show.schedule_button")}</DialogTitle>
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
                  {I18n.t("service_bookings.show.complete_button")}
                </Button>
              )}

              {service_booking.actions.can_give_feedback && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>{I18n.t("service_bookings.feedback_form.add_feedback")}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{I18n.t("service_bookings.feedback_form.add_feedback")}</DialogTitle>
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
                    const reason = window.prompt(I18n.t("service_bookings.cancel.reason_prompt"))
                    if (reason) {
                      cancelMutation.mutate(reason)
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {I18n.t("service_bookings.show.cancel_button")}
                </Button>
              )}

              {service_booking.actions.can_refund && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    const confirmed = window.confirm(I18n.t("service_bookings.refund.confirm"))
                    if (confirmed) {
                      refundMutation.mutate()
                    }
                  }}
                  disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {I18n.t("service_bookings.refund.button")}
                </Button>
              )}

              {service_booking.actions.can_mark_deposit_paid && (
                <Button
                  variant="outline"
                  onClick={() => paymentActionMutation.mutate({ action: "mark_deposit_paid" })}
                  disabled={paymentActionMutation.isPending}
                >
                  {I18n.t("service_bookings.payment_tracking.mark_deposit_paid")}
                </Button>
              )}

              {service_booking.actions.can_confirm_deposit && (
                <Button
                  variant="outline"
                  onClick={() => paymentActionMutation.mutate({ action: "confirm_deposit" })}
                  disabled={paymentActionMutation.isPending}
                >
                  {I18n.t("service_bookings.payment_tracking.confirm_deposit")}
                </Button>
              )}

              {service_booking.actions.can_mark_balance_paid && (
                <Button
                  variant="outline"
                  onClick={() => paymentActionMutation.mutate({ action: "mark_balance_paid" })}
                  disabled={paymentActionMutation.isPending}
                >
                  {I18n.t("service_bookings.payment_tracking.mark_balance_paid")}
                </Button>
              )}

              {service_booking.actions.can_confirm_balance && (
                <Button
                  variant="outline"
                  onClick={() => paymentActionMutation.mutate({ action: "confirm_balance" })}
                  disabled={paymentActionMutation.isPending}
                >
                  {I18n.t("service_bookings.payment_tracking.confirm_balance")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
