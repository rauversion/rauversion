import React from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get, patch } from "@rails/request.js"
import { CalendarDays, Check, FileSignature, Loader2, MapPin, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import I18n from "@/stores/locales"

const currency = (amount, code = "clp") => {
  const value = Number(amount || 0)
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: code.toUpperCase(),
    maximumFractionDigits: code.toLowerCase() === "clp" ? 0 : 2,
  })
}

const termsFromProposal = (proposal) => ({
  proposed_amount: proposal.proposed_amount || "",
  deposit_percentage: proposal.deposit_percentage || 50,
  fee_type: proposal.fee_type || "landed",
  transport_included: Boolean(proposal.transport_included),
  accommodation_included: Boolean(proposal.accommodation_included),
  hospitality_included: Boolean(proposal.hospitality_included),
  catering_included: Boolean(proposal.catering_included),
  guest_list_count: proposal.guest_list_count || 0,
  benefits: proposal.benefits || "",
  technical_notes: proposal.technical_notes || "",
  message: "",
})

function OfferSummary({ proposal }) {
  return (
    <div className="grid gap-3 text-sm md:grid-cols-2">
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.amount")}</div>
        <div className="text-lg font-semibold">{currency(proposal.proposed_amount, proposal.currency)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.deposit")}</div>
        <div className="font-semibold">
          {proposal.deposit_percentage}% · {currency(proposal.deposit_amount, proposal.currency)}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.balance")}</div>
        <div className="font-semibold">{currency(proposal.balance_amount, proposal.currency)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.fee_type")}</div>
        <div className="font-semibold">{I18n.t(`service_booking_proposals.fee_type_labels.${proposal.fee_type}`)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.artist_fee")}</div>
        <div className="font-semibold">{currency(proposal.platform_fee_amount, proposal.currency)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.artist_payout")}</div>
        <div className="font-semibold">{currency(proposal.artist_payout_amount, proposal.currency)}</div>
      </div>
    </div>
  )
}

function CounterForm({ proposal, onSubmit, pending }) {
  const [form, setForm] = React.useState(() => termsFromProposal(proposal))

  React.useEffect(() => {
    setForm(termsFromProposal(proposal))
  }, [proposal.id, proposal.updated_at])

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>{I18n.t("service_booking_proposals.form.amount")}</Label>
          <Input
            type="number"
            min="1"
            value={form.proposed_amount}
            onChange={(event) => update("proposed_amount", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{I18n.t("service_booking_proposals.form.deposit_percentage")}</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={form.deposit_percentage}
            onChange={(event) => update("deposit_percentage", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{I18n.t("service_booking_proposals.form.fee_type")}</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.fee_type}
            onChange={(event) => update("fee_type", event.target.value)}
          >
            <option value="landed">{I18n.t("service_booking_proposals.fee_type_labels.landed")}</option>
            <option value="landed_hospitalities">{I18n.t("service_booking_proposals.fee_type_labels.landed_hospitalities")}</option>
            <option value="no_landed_add_ons">{I18n.t("service_booking_proposals.fee_type_labels.no_landed_add_ons")}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
        {[
          ["transport_included", I18n.t("service_booking_proposals.form.transport_included")],
          ["accommodation_included", I18n.t("service_booking_proposals.form.accommodation_included")],
          ["hospitality_included", I18n.t("service_booking_proposals.form.hospitality_included")],
          ["catering_included", I18n.t("service_booking_proposals.form.catering_included")],
        ].map(([field, label]) => (
          <div key={field} className="flex items-center space-x-2">
            <Checkbox
              id={`counter_${field}`}
              checked={Boolean(form[field])}
              onCheckedChange={(checked) => update(field, checked === true)}
            />
            <Label htmlFor={`counter_${field}`} className="text-sm font-normal">
              {label}
            </Label>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>{I18n.t("service_booking_proposals.form.guest_list_count")}</Label>
          <Input
            type="number"
            min="0"
            value={form.guest_list_count}
            onChange={(event) => update("guest_list_count", event.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{I18n.t("service_booking_proposals.form.message")}</Label>
          <Input
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{I18n.t("service_booking_proposals.form.benefits")}</Label>
          <Textarea value={form.benefits} onChange={(event) => update("benefits", event.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>{I18n.t("service_booking_proposals.form.technical_notes")}</Label>
          <Textarea value={form.technical_notes} onChange={(event) => update("technical_notes", event.target.value)} rows={3} />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <RotateCcw className="mr-2 h-4 w-4" />
        {I18n.t("service_booking_proposals.actions.counter")}
      </Button>
    </form>
  )
}

export function ServiceBookingProposalDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["service_booking_proposal", id],
    queryFn: async () => {
      const response = await get(`/service_booking_proposals/${id}.json`, {
        responseKind: "json",
      })
      return response.json
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ action, body }) => {
      const response = await patch(`/service_booking_proposals/${id}/${action}.json`, {
        responseKind: "json",
        body: body ? { service_booking_proposal: body } : undefined,
      })
      if (!response.ok) throw new Error("proposal action failed")
      return response.json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_booking_proposal", id] })
      toast({
        title: I18n.t("service_booking_proposals.messages.success"),
        description: I18n.t("service_booking_proposals.messages.updated"),
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: I18n.t("service_booking_proposals.messages.error"),
        description: I18n.t("service_booking_proposals.messages.update_error"),
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

  const proposal = data?.service_booking_proposal
  if (!proposal) return null

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{I18n.t(`service_booking_proposals.status.${proposal.status}`)}</Badge>
            <Badge variant="outline">{I18n.t(`service_booking_proposals.viewer.${proposal.viewer.role}`)}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{proposal.event_name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
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
        {proposal.service_booking_id && (
          <Button asChild>
            <Link to={`/service_bookings/${proposal.service_booking_id}`}>
              {I18n.t("service_booking_proposals.actions.view_booking")}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t("service_booking_proposals.show.current_offer")}</CardTitle>
              <CardDescription>
                {I18n.t("service_booking_proposals.show.current_offer_by", {
                  name: proposal.current_offer_by?.name,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <OfferSummary proposal={proposal} />
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p>{I18n.t("service_booking_proposals.form.transport_included")}: {proposal.transport_included ? I18n.t("yes") : I18n.t("no")}</p>
                <p>{I18n.t("service_booking_proposals.form.accommodation_included")}: {proposal.accommodation_included ? I18n.t("yes") : I18n.t("no")}</p>
                <p>{I18n.t("service_booking_proposals.form.hospitality_included")}: {proposal.hospitality_included ? I18n.t("yes") : I18n.t("no")}</p>
                <p>{I18n.t("service_booking_proposals.form.catering_included")}: {proposal.catering_included ? I18n.t("yes") : I18n.t("no")}</p>
              </div>
              {proposal.message && (
                <div className="rounded-lg bg-muted p-4 text-sm">{proposal.message}</div>
              )}
            </CardContent>
          </Card>

          {proposal.actions.can_counter && (
            <Card>
              <CardHeader>
                <CardTitle>{I18n.t("service_booking_proposals.show.counter_title")}</CardTitle>
                <CardDescription>{I18n.t("service_booking_proposals.show.counter_description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <CounterForm
                  proposal={proposal}
                  pending={actionMutation.isPending}
                  onSubmit={(body) => actionMutation.mutate({ action: "counter", body })}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{I18n.t("service_booking_proposals.show.history")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(proposal.negotiation_history || []).map((entry, index) => (
                <div key={`${entry.occurred_at}-${index}`} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{entry.actor_name}</strong>
                    <span className="text-muted-foreground">
                      {I18n.t(`service_booking_proposals.history.${entry.action}`, { defaultValue: entry.action })}
                    </span>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    {currency(entry.offer?.proposed_amount, entry.offer?.currency || proposal.currency)}
                    {" · "}
                    {entry.offer?.deposit_percentage}% {I18n.t("service_booking_proposals.labels.deposit")}
                    {" · "}
                    {I18n.t(`service_booking_proposals.fee_type_labels.${entry.offer?.fee_type}`)}
                  </div>
                  {entry.offer?.message && <p className="mt-2">{entry.offer.message}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t("service_booking_proposals.show.parties")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.booker")}</div>
                <div className="font-medium">{proposal.booker.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.artist")}</div>
                <div className="font-medium">{proposal.artist.name}</div>
              </div>
              {proposal.conversations?.length > 0 && (
                <div>
                  <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.conversation")}</div>
                  <a
                    className="text-primary underline"
                    href={`/conversations/${proposal.conversations[0].id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {proposal.conversations[0].subject}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {proposal.status === "accepted" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  {I18n.t("service_booking_proposals.show.contract")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{I18n.t("service_booking_proposals.show.contract_signed")}</p>
                <p className="text-muted-foreground">
                  {proposal.contract_snapshot?.digital_signature_statement}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{I18n.t("service_booking_proposals.show.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {proposal.actions.can_accept && (
                <Button
                  onClick={() => actionMutation.mutate({ action: "accept" })}
                  disabled={actionMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {I18n.t("service_booking_proposals.actions.accept")}
                </Button>
              )}
              {proposal.actions.can_reject && (
                <Button
                  variant="outline"
                  onClick={() => actionMutation.mutate({ action: "reject" })}
                  disabled={actionMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  {I18n.t("service_booking_proposals.actions.reject")}
                </Button>
              )}
              {proposal.actions.can_cancel && (
                <Button
                  variant="destructive"
                  onClick={() => actionMutation.mutate({ action: "cancel" })}
                  disabled={actionMutation.isPending}
                >
                  {I18n.t("service_booking_proposals.actions.cancel")}
                </Button>
              )}
              {!proposal.actions.can_accept && !proposal.actions.can_reject && !proposal.actions.can_cancel && (
                <p className="text-sm text-muted-foreground">
                  {I18n.t("service_booking_proposals.show.no_actions")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
