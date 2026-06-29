import React from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { get, post, patch } from "@rails/request.js"
import { format } from "date-fns"
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileSignature,
  Link as LinkIcon,
  Loader2,
  MapPin,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Star,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    deposit_checkout_session_id?: string
    deposit_payment_intent_id?: string
    balance_checkout_session_id?: string
    balance_payment_intent_id?: string
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
    can_pay_deposit_with_stripe: boolean
    can_pay_balance_with_stripe: boolean
    can_give_feedback: boolean
  }
  conversations: Conversation[]
}

type Tone = "neutral" | "primary" | "accent" | "secondary" | "success" | "destructive"

const toneClasses: Record<Tone, { pill: string; panel: string; dot: string; accent: string }> = {
  neutral: {
    pill: "border-border bg-muted text-muted-foreground",
    panel: "border-border bg-muted/40",
    dot: "bg-muted-foreground",
    accent: "text-muted-foreground",
  },
  primary: {
    pill: "border-chart-1/30 bg-chart-1/10 text-foreground",
    panel: "border-chart-1/20 bg-chart-1/10",
    dot: "bg-chart-1",
    accent: "text-chart-1",
  },
  accent: {
    pill: "border-chart-3/30 bg-chart-3/10 text-foreground",
    panel: "border-chart-3/20 bg-chart-3/10",
    dot: "bg-chart-3",
    accent: "text-chart-3",
  },
  secondary: {
    pill: "border-chart-4/30 bg-chart-4/10 text-foreground",
    panel: "border-chart-4/20 bg-chart-4/10",
    dot: "bg-chart-4",
    accent: "text-chart-4",
  },
  success: {
    pill: "border-chart-2/30 bg-chart-2/10 text-foreground",
    panel: "border-chart-2/20 bg-chart-2/10",
    dot: "bg-chart-2",
    accent: "text-chart-2",
  },
  destructive: {
    pill: "border-destructive/30 bg-destructive/10 text-destructive",
    panel: "border-destructive/20 bg-destructive/10",
    dot: "bg-destructive",
    accent: "text-destructive",
  },
}

const bookingStatusTone: Record<string, Tone> = {
  pending_confirmation: "primary",
  confirmed: "primary",
  scheduled: "secondary",
  in_progress: "accent",
  completed: "success",
  cancelled: "destructive",
  refunded: "neutral",
}

const paymentStatusTone: Record<string, Tone> = {
  unpaid: "neutral",
  pending: "primary",
  checkout_created: "accent",
  reported: "primary",
  confirmed: "success",
  paid: "success",
  partially_refunded: "secondary",
  refunded: "neutral",
  failed: "destructive",
}

const refundStatusTone: Record<string, Tone> = {
  not_requested: "neutral",
  requested: "primary",
  processing: "accent",
  refunded: "success",
  failed: "destructive",
}

const contractStatusTone: Record<string, Tone> = {
  not_generated: "neutral",
  auto_signed: "success",
  voided: "destructive",
}

const humanize = (value?: string) =>
  (value || "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

const translated = (scope: string, value?: string) =>
  value ? I18n.t(`${scope}.${value}`, { defaultValue: humanize(value) }) : ""

const formatDate = (value?: string, pattern = "PPP") => {
  if (!value) return null

  try {
    return format(new Date(value), pattern)
  } catch (_error) {
    return value
  }
}

const formatMoney = (amount?: number, currency = "usd") => {
  if (amount === null || amount === undefined) return null

  const currencyCode = String(currency || "usd").toUpperCase()
  return Number(amount).toLocaleString(undefined, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    maximumFractionDigits: currencyCode === "CLP" ? 0 : 2,
  })
}

function StatusPill({
  label,
  tone = "neutral",
  icon: Icon,
}: {
  label: string
  tone?: Tone
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone].pill}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
  )
}

function MetricTile({
  label,
  value,
  tone = "neutral",
  icon: Icon,
}: {
  label: string
  value?: string | null
  tone?: Tone
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone].panel}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${toneClasses[tone].accent}`} />
      </div>
      <div className="text-xl font-semibold text-foreground">{value || "-"}</div>
    </div>
  )
}

function PersonCard({
  title,
  person,
  tone,
}: {
  title: string
  person: { name: string; avatar_url: string }
  tone: Tone
}) {
  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone].panel}`}>
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11 border border-background">
          <AvatarImage src={person.avatar_url} />
          <AvatarFallback>{person.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">{person.name}</div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string
  value?: React.ReactNode
  href?: string
}) {
  if (!value) return null

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {href ? (
        <a className="max-w-[65%] break-all text-right text-sm font-medium text-primary underline-offset-4 hover:underline" href={href} target="_blank" rel="noreferrer">
          {value}
        </a>
      ) : (
        <span className="max-w-[65%] break-words text-right text-sm font-medium text-foreground">{value}</span>
      )}
    </div>
  )
}

function MilestoneCard({
  title,
  amount,
  status,
  paidAt,
  confirmedAt,
  sessionId,
  action,
  tone,
}: {
  title: string
  amount?: string | null
  status?: string
  paidAt?: string
  confirmedAt?: string
  sessionId?: string
  action?: React.ReactNode
  tone: Tone
}) {
  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone].panel}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">{amount || "-"}</div>
        </div>
        <StatusPill
          label={translated("service_bookings.payment_statuses", status)}
          tone={tone}
        />
      </div>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${toneClasses[tone].dot}`} />
          <span>{confirmedAt ? formatDate(confirmedAt, "PPp") : paidAt ? formatDate(paidAt, "PPp") : translated("service_bookings.payment_statuses", status)}</span>
        </div>
        {sessionId && (
          <div className="flex items-center gap-2">
            <ReceiptText className="h-3.5 w-3.5" />
            <span className="truncate font-mono">{sessionId}</span>
          </div>
        )}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
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

  const stripeCheckoutMutation = useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      const response = await post(`/service_bookings/${id}/${action}`, {
        responseKind: "json",
      })
      const result = await response.json
      if (!response.ok) throw new Error(result?.error || "checkout failed")
      return result
    },
    onSuccess: (result) => {
      if (result.checkout_url) {
        window.location.href = result.checkout_url
        return
      }

      queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_bookings.messages.error"),
        description: I18n.t("service_bookings.payment_tracking.stripe_error"),
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!booking) return null

  const { service_booking } = booking
  const payment = service_booking.payment
  const contract = service_booking.contract
  const bookingTone = bookingStatusTone[service_booking.status] || "neutral"
  const paymentTone = paymentStatusTone[payment?.status || "unpaid"] || "neutral"
  const refundTone = refundStatusTone[payment?.refund_status || "not_requested"] || "neutral"
  const contractTone = contractStatusTone[contract?.status || "not_generated"] || "neutral"
  const currencyCode = payment?.currency || "usd"
  const totalAmount = formatMoney(payment?.total_amount, currencyCode)
  const depositAmount = formatMoney(payment?.deposit_amount, currencyCode)
  const balanceAmount = formatMoney(payment?.balance_due_amount, currencyCode)
  const platformFee = formatMoney(payment?.platform_fee_amount, currencyCode)
  const artistPayout = formatMoney(payment?.artist_payout_amount, currencyCode)
  const eventDate = service_booking.venue?.starts_at || service_booking.metadata.scheduled_date
  const eventLocation = [
    service_booking.venue?.name || service_booking.metadata.meeting_location,
    service_booking.venue?.city,
    service_booking.venue?.country,
  ].filter(Boolean).join(", ")
  const actionCount = [
    service_booking.actions.can_confirm,
    service_booking.actions.can_schedule,
    service_booking.actions.can_complete,
    service_booking.actions.can_give_feedback,
    service_booking.actions.can_cancel,
    service_booking.actions.can_refund,
  ].filter(Boolean).length

  const stripeButton = (action: "deposit_checkout" | "balance_checkout", label: string) => (
    <Button
      className="w-full"
      onClick={() => stripeCheckoutMutation.mutate({ action })}
      disabled={stripeCheckoutMutation.isPending}
    >
      {stripeCheckoutMutation.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/40 px-6 py-6 text-foreground">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {service_booking.service_product.service_kind && (
                  <Badge variant="secondary">
                    {humanize(service_booking.service_product.service_kind)}
                  </Badge>
                )}
                {service_booking.service_product.category && (
                  <Badge variant="outline">
                    {humanize(service_booking.service_product.category)}
                  </Badge>
                )}
              </div>
              <h1 className="truncate text-3xl font-semibold tracking-tight">
                {service_booking.service_product.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {I18n.t("service_bookings.labels.created_on", {
                  date: formatDate(service_booking.created_at),
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <StatusPill
                label={translated("service_bookings.status", service_booking.status)}
                tone={bookingTone}
                icon={ShieldCheck}
              />
              {payment && (
                <StatusPill
                  label={translated("service_bookings.payment_statuses", payment.status)}
                  tone={paymentTone}
                  icon={WalletCards}
                />
              )}
              {payment?.refund_status && (
                <StatusPill
                  label={translated("service_bookings.refund_statuses", payment.refund_status)}
                  tone={refundTone}
                  icon={ReceiptText}
                />
              )}
              {contract && contract.status !== "not_generated" && (
                <StatusPill
                  label={translated("service_bookings.contract_status", contract.status)}
                  tone={contractTone}
                  icon={FileSignature}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label={I18n.t("service_bookings.payment.total")} value={totalAmount} tone="success" icon={Banknote} />
          <MetricTile label={I18n.t("service_bookings.payment.deposit")} value={depositAmount} tone={paymentStatusTone[payment?.deposit_status || "unpaid"] || "neutral"} icon={CreditCard} />
          <MetricTile label={I18n.t("service_bookings.payment.balance")} value={balanceAmount} tone={paymentStatusTone[payment?.balance_status || "unpaid"] || "neutral"} icon={WalletCards} />
          <MetricTile label={I18n.t("service_bookings.payment.artist_payout")} value={artistPayout} tone="secondary" icon={ReceiptText} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {I18n.t("service_bookings.labels.schedule_details")}
              </CardTitle>
              <CardDescription>{service_booking.service_product.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Clock3 className="h-4 w-4 text-primary" />
                  {I18n.t("service_bookings.labels.scheduled_for")}
                </div>
                <div className="text-lg font-semibold">
                  {formatDate(eventDate) || I18n.t("service_bookings.index.not_scheduled")}
                </div>
                {service_booking.metadata.scheduled_time && (
                  <div className="mt-1 text-sm text-muted-foreground">{service_booking.metadata.scheduled_time}</div>
                )}
                {service_booking.metadata.timezone && (
                  <div className="mt-1 text-sm text-muted-foreground">{service_booking.metadata.timezone}</div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  {I18n.t("service_bookings.labels.location")}
                </div>
                <div className="text-lg font-semibold">{eventLocation || "-"}</div>
                {service_booking.venue?.address && (
                  <div className="mt-1 text-sm text-muted-foreground">{service_booking.venue.address}</div>
                )}
                {service_booking.metadata.meeting_link && (
                  <a
                    href={service_booking.metadata.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {I18n.t("service_bookings.index.online_meeting")}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WalletCards className="h-5 w-5" />
                  {I18n.t("service_bookings.payment.title")}
                </CardTitle>
                <CardDescription>
                  {payment.checkout_provider ? humanize(payment.checkout_provider) : translated("service_bookings.payment_statuses", payment.status)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <MilestoneCard
                    title={I18n.t("service_bookings.payment.deposit")}
                    amount={depositAmount}
                    status={payment.deposit_status}
                    paidAt={payment.deposit_paid_at}
                    confirmedAt={payment.deposit_confirmed_at}
                    sessionId={payment.deposit_checkout_session_id}
                    tone={paymentStatusTone[payment.deposit_status || "unpaid"] || "neutral"}
                    action={
                      service_booking.actions.can_pay_deposit_with_stripe
                        ? stripeButton("deposit_checkout", I18n.t("service_bookings.payment_tracking.pay_deposit_with_stripe"))
                        : null
                    }
                  />
                  <MilestoneCard
                    title={I18n.t("service_bookings.payment.balance")}
                    amount={balanceAmount}
                    status={payment.balance_status}
                    paidAt={payment.balance_paid_at}
                    confirmedAt={payment.balance_confirmed_at}
                    sessionId={payment.balance_checkout_session_id}
                    tone={paymentStatusTone[payment.balance_status || "unpaid"] || "neutral"}
                    action={
                      service_booking.actions.can_pay_balance_with_stripe
                        ? stripeButton("balance_checkout", I18n.t("service_bookings.payment_tracking.pay_balance_with_stripe"))
                        : null
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <DetailRow label={I18n.t("service_bookings.payment.status")} value={<StatusPill label={translated("service_bookings.payment_statuses", payment.status)} tone={paymentTone} />} />
                    <DetailRow label={I18n.t("service_bookings.payment.refund")} value={<StatusPill label={translated("service_bookings.refund_statuses", payment.refund_status)} tone={refundTone} />} />
                    <DetailRow label={I18n.t("service_bookings.payment.artist_fee")} value={platformFee} />
                    <DetailRow label={I18n.t("service_bookings.payment.artist_payout")} value={artistPayout} />
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <DetailRow label={I18n.t("service_bookings.payment.provider")} value={payment.checkout_provider ? humanize(payment.checkout_provider) : null} />
                    <DetailRow label={I18n.t("service_bookings.payment.payment_intent")} value={payment.payment_intent_id} />
                    <DetailRow label="Session" value={payment.payment_session_id} />
                    <DetailRow label="Refund ID" value={payment.refund_id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(service_booking.metadata.special_requirements || service_booking.metadata.provider_notes || service_booking.cancelled_by || service_booking.rating) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5" />
                  {I18n.t("service_bookings.show.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service_booking.metadata.special_requirements && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-1 text-sm font-medium">{I18n.t("service_bookings.show.customer_info.special_requirements")}</div>
                    <p className="text-sm text-muted-foreground">{service_booking.metadata.special_requirements}</p>
                  </div>
                )}
                {service_booking.metadata.provider_notes && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-1 text-sm font-medium">{I18n.t("service_bookings.index.provider_notes")}</div>
                    <p className="text-sm text-muted-foreground">{service_booking.metadata.provider_notes}</p>
                  </div>
                )}
                {service_booking.cancelled_by && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-destructive">
                      <XCircle className="h-4 w-4" />
                      {I18n.t("service_bookings.labels.cancellation_details")}
                    </div>
                    <p className="text-sm text-destructive">
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
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
                      <Star className="h-4 w-4" />
                      {I18n.t("service_bookings.feedback_form.feedback")}
                    </div>
                    <p className="text-sm text-primary">
                      {I18n.t("service_bookings.feedback_form.rating")}: {service_booking.rating}/5
                    </p>
                    {service_booking.feedback && <p className="mt-2 text-sm text-primary">{service_booking.feedback}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                {I18n.t("service_booking_proposals.show.parties")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <PersonCard title={I18n.t("service_bookings.labels.provider")} person={service_booking.provider} tone="primary" />
              <PersonCard title={I18n.t("service_bookings.labels.customer")} person={service_booking.customer} tone="success" />
            </CardContent>
          </Card>

          {contract && contract.status !== "not_generated" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  {I18n.t("service_bookings.contract.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow label={I18n.t("service_bookings.contract.status")} value={<StatusPill label={translated("service_bookings.contract_status", contract.status)} tone={contractTone} />} />
                <DetailRow label={I18n.t("service_bookings.contract.signed_at")} value={formatDate(contract.signed_at)} />
                <DetailRow
                  label={I18n.t("service_bookings.contract.proposal")}
                  value={contract.proposal_id ? `#${contract.proposal_id}` : null}
                  href={contract.proposal_id ? `/service_booking_proposals/${contract.proposal_id}` : undefined}
                />
              </CardContent>
            </Card>
          )}

          {service_booking.conversations && service_booking.conversations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {I18n.t("service_bookings.labels.conversations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service_booking.conversations.map((conversation) => (
                  <a
                    key={conversation.id}
                    href={`/conversations/${conversation.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="truncate font-medium">{conversation.subject || I18n.t("service_bookings.labels.view_conversation")}</span>
                    <StatusPill label={humanize(conversation.status)} tone="accent" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{I18n.t("service_bookings.show.actions")}</CardTitle>
              <CardDescription>
                {actionCount > 0 ? translated("service_bookings.status", service_booking.status) : I18n.t("service_bookings.show.no_actions")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {service_booking.actions.can_confirm && (
                <Button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                  {confirmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {I18n.t("service_bookings.show.confirm_button")}
                </Button>
              )}

              {service_booking.actions.can_schedule && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {I18n.t("service_bookings.show.schedule_button")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{I18n.t("service_bookings.show.schedule_button")}</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm
                      bookingId={service_booking.id}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {service_booking.actions.can_complete && (
                <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                  {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {I18n.t("service_bookings.show.complete_button")}
                </Button>
              )}

              {service_booking.actions.can_give_feedback && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Star className="mr-2 h-4 w-4" />
                      {I18n.t("service_bookings.feedback_form.add_feedback")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{I18n.t("service_bookings.feedback_form.add_feedback")}</DialogTitle>
                    </DialogHeader>
                    <FeedbackForm
                      bookingId={service_booking.id}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["service_booking", id] })
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}

              {service_booking.actions.can_refund && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    const confirmed = window.confirm(I18n.t("service_bookings.refund.confirm"))
                    if (confirmed) refundMutation.mutate()
                  }}
                  disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {I18n.t("service_bookings.refund.button")}
                </Button>
              )}

              {service_booking.actions.can_cancel && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const reason = window.prompt(I18n.t("service_bookings.cancel.reason_prompt"))
                    if (reason) cancelMutation.mutate(reason)
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {I18n.t("service_bookings.show.cancel_button")}
                </Button>
              )}

              {actionCount === 0 && (
                <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                  {I18n.t("service_bookings.show.no_actions")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
