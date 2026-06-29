import React from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get, patch } from "@rails/request.js"
import { format } from "date-fns"
import { CalendarDays, Check, FileSignature, Loader2, MapPin, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import I18n from "@/stores/locales"

const currency = (amount, code = "clp") => {
  if (amount === null || amount === undefined || amount === "") return ""

  const currencyCode = String(code || "clp").toUpperCase()
  const value = Number(amount || 0)

  if (Number.isNaN(value)) {
    return `${amount} ${currencyCode}`
  }

  return value.toLocaleString(undefined, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    maximumFractionDigits: currencyCode === "CLP" ? 0 : 2,
  })
}

const formatDate = (value, pattern = "PPP") => {
  if (!value) return null

  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
    return format(date, pattern)
  } catch (_error) {
    return value
  }
}

const partySnapshot = (person) => ({
  id: person?.id,
  name: person?.name,
  username: person?.username,
})

const contractSnapshotFromProposal = (proposal) => (
  proposal.contract_snapshot || {
    service_booking_id: proposal.service_booking_id,
    proposal_id: proposal.id,
    event_name: proposal.event_name,
    event_date: proposal.event_date,
    starts_at: proposal.starts_at,
    ends_at: proposal.ends_at,
    venue: {
      name: proposal.venue_name,
      address: proposal.venue_address,
      city: proposal.city,
      country: proposal.country,
    },
    parties: {
      booker: partySnapshot(proposal.booker),
      artist: partySnapshot(proposal.artist),
    },
    financials: {
      proposed_amount: proposal.proposed_amount,
      currency: proposal.currency,
      deposit_percentage: proposal.deposit_percentage,
      deposit_amount: proposal.deposit_amount,
      balance_amount: proposal.balance_amount,
      platform_fee_rate: proposal.platform_fee_rate,
      platform_fee_min_amount: proposal.platform_fee_min_amount,
      platform_fee_amount: proposal.platform_fee_amount,
      artist_payout_amount: proposal.artist_payout_amount,
    },
    terms: {
      fee_type: proposal.fee_type,
      transport_included: proposal.transport_included,
      accommodation_included: proposal.accommodation_included,
      hospitality_included: proposal.hospitality_included,
      catering_included: proposal.catering_included,
      guest_list_count: proposal.guest_list_count,
      benefits: proposal.benefits,
      technical_notes: proposal.technical_notes,
      message: proposal.message,
    },
    accepted_at: proposal.accepted_at,
    digital_signature_statement: null,
  }
)

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
  const formatted = (field, amountField) => (
    proposal[field] || currency(proposal[amountField], proposal.currency)
  )

  return (
    <div className="grid gap-3 text-sm md:grid-cols-2">
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.amount")}</div>
        <div className="text-lg font-semibold">{formatted("formatted_proposed_amount", "proposed_amount")}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.deposit")}</div>
        <div className="font-semibold">
          {proposal.deposit_percentage}% · {formatted("formatted_deposit_amount", "deposit_amount")}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.balance")}</div>
        <div className="font-semibold">{formatted("formatted_balance_amount", "balance_amount")}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.fee_type")}</div>
        <div className="font-semibold">{I18n.t(`service_booking_proposals.fee_type_labels.${proposal.fee_type}`)}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.artist_fee")}</div>
        <div className="font-semibold">{formatted("formatted_platform_fee_amount", "platform_fee_amount")}</div>
      </div>
      <div>
        <div className="text-muted-foreground">{I18n.t("service_booking_proposals.labels.artist_payout")}</div>
        <div className="font-semibold">{formatted("formatted_artist_payout_amount", "artist_payout_amount")}</div>
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
          <div className="flex items-center justify-between gap-3">
            <Label>{I18n.t("service_booking_proposals.form.amount")}</Label>
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
              {proposal.currency || "clp"}
            </span>
          </div>
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

function ContractRow({ label, value }) {
  if (value === null || value === undefined || value === "") return null

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function ContractSection({ title, children }) {
  return (
    <section className="rounded-lg border border-border bg-background/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      <div>{children}</div>
    </section>
  )
}

function ContractDialog({ proposal }) {
  const snapshot = contractSnapshotFromProposal(proposal)
  const financials = snapshot.financials || {}
  const terms = snapshot.terms || {}
  const venue = snapshot.venue || {}
  const parties = snapshot.parties || {}
  const contractCurrency = financials.currency || proposal.currency
  const accepted = Boolean(snapshot.accepted_at || proposal.status === "accepted")
  const yesNo = (value) => I18n.t(value ? "yes" : "no")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={accepted ? "default" : "outline"}>
          <FileSignature className="mr-2 h-4 w-4" />
          {I18n.t("service_booking_proposals.actions.view_contract")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{I18n.t("service_booking_proposals.show.contract")}</DialogTitle>
          <DialogDescription>
            {I18n.t(
              accepted
                ? "service_booking_proposals.show.contract_signed"
                : "service_booking_proposals.show.contract_preview_description"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <ContractSection title={I18n.t("service_booking_proposals.contract_sections.event")}>
            <ContractRow label={I18n.t("service_booking_proposals.form.event_name")} value={snapshot.event_name} />
            <ContractRow label={I18n.t("service_booking_proposals.form.event_date")} value={formatDate(snapshot.event_date)} />
            <ContractRow label={I18n.t("service_booking_proposals.form.start_time")} value={formatDate(snapshot.starts_at, "PPp")} />
            <ContractRow label={I18n.t("service_booking_proposals.form.end_time")} value={formatDate(snapshot.ends_at, "PPp")} />
            <ContractRow label={I18n.t("service_booking_proposals.contract_sections.proposal")} value={snapshot.proposal_id ? `#${snapshot.proposal_id}` : null} />
            <ContractRow label={I18n.t("service_booking_proposals.contract_sections.booking")} value={snapshot.service_booking_id ? `#${snapshot.service_booking_id}` : null} />
          </ContractSection>

          <ContractSection title={I18n.t("service_booking_proposals.contract_sections.venue")}>
            <ContractRow label={I18n.t("service_booking_proposals.form.venue_name")} value={venue.name} />
            <ContractRow label={I18n.t("service_booking_proposals.form.venue_address")} value={venue.address} />
            <ContractRow label={I18n.t("service_booking_proposals.form.city")} value={venue.city} />
            <ContractRow label={I18n.t("service_booking_proposals.form.country")} value={venue.country} />
          </ContractSection>

          <ContractSection title={I18n.t("service_booking_proposals.contract_sections.parties")}>
            <ContractRow label={I18n.t("service_booking_proposals.labels.booker")} value={parties.booker?.name} />
            <ContractRow label={I18n.t("service_booking_proposals.contract_sections.booker_username")} value={parties.booker?.username} />
            <ContractRow label={I18n.t("service_booking_proposals.labels.artist")} value={parties.artist?.name} />
            <ContractRow label={I18n.t("service_booking_proposals.contract_sections.artist_username")} value={parties.artist?.username} />
          </ContractSection>

          <ContractSection title={I18n.t("service_booking_proposals.contract_sections.financials")}>
            <ContractRow label={I18n.t("service_booking_proposals.form.currency")} value={contractCurrency?.toUpperCase()} />
            <ContractRow label={I18n.t("service_booking_proposals.labels.amount")} value={currency(financials.proposed_amount, contractCurrency)} />
            <ContractRow label={I18n.t("service_booking_proposals.labels.deposit")} value={`${financials.deposit_percentage || 0}% · ${currency(financials.deposit_amount, contractCurrency)}`} />
            <ContractRow label={I18n.t("service_booking_proposals.labels.balance")} value={currency(financials.balance_amount, contractCurrency)} />
            <ContractRow label={I18n.t("service_booking_proposals.labels.artist_fee")} value={currency(financials.platform_fee_amount, contractCurrency)} />
            <ContractRow label={I18n.t("service_booking_proposals.labels.artist_payout")} value={currency(financials.artist_payout_amount, contractCurrency)} />
          </ContractSection>

          <ContractSection title={I18n.t("service_booking_proposals.contract_sections.terms")}>
            <ContractRow label={I18n.t("service_booking_proposals.labels.fee_type")} value={I18n.t(`service_booking_proposals.fee_type_labels.${terms.fee_type}`, { defaultValue: terms.fee_type })} />
            <ContractRow label={I18n.t("service_booking_proposals.form.transport_included")} value={yesNo(terms.transport_included)} />
            <ContractRow label={I18n.t("service_booking_proposals.form.accommodation_included")} value={yesNo(terms.accommodation_included)} />
            <ContractRow label={I18n.t("service_booking_proposals.form.hospitality_included")} value={yesNo(terms.hospitality_included)} />
            <ContractRow label={I18n.t("service_booking_proposals.form.catering_included")} value={yesNo(terms.catering_included)} />
            <ContractRow label={I18n.t("service_booking_proposals.form.guest_list_count")} value={terms.guest_list_count} />
          </ContractSection>

          <ContractSection title={I18n.t("service_booking_proposals.contract_sections.signature")}>
            <ContractRow label={I18n.t("service_booking_proposals.contract_sections.accepted_at")} value={formatDate(snapshot.accepted_at, "PPp")} />
            <ContractRow
              label={I18n.t("service_booking_proposals.contract_sections.statement")}
              value={snapshot.digital_signature_statement || I18n.t("service_booking_proposals.show.contract_preview")}
            />
          </ContractSection>
        </div>

        {(terms.benefits || terms.technical_notes || terms.message) && (
          <div className="grid gap-4">
            {terms.benefits && (
              <ContractSection title={I18n.t("service_booking_proposals.form.benefits")}>
                <p className="whitespace-pre-wrap text-sm text-foreground">{terms.benefits}</p>
              </ContractSection>
            )}
            {terms.technical_notes && (
              <ContractSection title={I18n.t("service_booking_proposals.form.technical_notes")}>
                <p className="whitespace-pre-wrap text-sm text-foreground">{terms.technical_notes}</p>
              </ContractSection>
            )}
            {terms.message && (
              <ContractSection title={I18n.t("service_booking_proposals.form.message")}>
                <p className="whitespace-pre-wrap text-sm text-foreground">{terms.message}</p>
              </ContractSection>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                {I18n.t("service_booking_proposals.show.contract")}
              </CardTitle>
              <CardDescription>
                {I18n.t(
                  proposal.status === "accepted"
                    ? "service_booking_proposals.show.contract_signed"
                    : "service_booking_proposals.show.contract_preview_description"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractDialog proposal={proposal} />
            </CardContent>
          </Card>

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
