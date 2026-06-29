import React from "react"
import { useNavigate } from "react-router-dom"
import { post } from "@rails/request.js"
import { Banknote, Hotel, Loader2, MapPinned, Music2, Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import useAuthStore from "@/stores/authStore"
import I18n from "@/stores/locales"

const feeTypes = [
  {
    value: "landed",
    icon: MapPinned,
    title: I18n.t("service_booking_proposals.fee_types.landed.title"),
    description: I18n.t("service_booking_proposals.fee_types.landed.description"),
  },
  {
    value: "landed_hospitalities",
    icon: Hotel,
    title: I18n.t("service_booking_proposals.fee_types.landed_hospitalities.title"),
    description: I18n.t("service_booking_proposals.fee_types.landed_hospitalities.description"),
  },
  {
    value: "no_landed_add_ons",
    icon: Banknote,
    title: I18n.t("service_booking_proposals.fee_types.no_landed_add_ons.title"),
    description: I18n.t("service_booking_proposals.fee_types.no_landed_add_ons.description"),
  },
]

const initialForm = (product) => ({
  event_name: "",
  event_date: "",
  start_time: "",
  end_time: "",
  venue_name: "",
  venue_address: "",
  city: product.home_city || "",
  country: product.home_country || "Chile",
  proposed_amount: product.price || "",
  currency: product.currency || "clp",
  deposit_percentage: 50,
  fee_type: product.performance_format === "no_landed_add_ons" ? "no_landed_add_ons" : "landed",
  transport_included: false,
  accommodation_included: false,
  hospitality_included: false,
  catering_included: false,
  guest_list_count: 0,
  benefits: "",
  technical_notes: "",
  message: "",
})

const currency = (amount, code = "clp") => {
  const value = Number(amount || 0)
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: code.toUpperCase(),
    currencyDisplay: "code",
    maximumFractionDigits: code.toLowerCase() === "clp" ? 0 : 2,
  })
}

const toDateTime = (date, time) => {
  if (!date || !time) return ""
  return `${date}T${time}:00`
}

export default function BookingProposalModal({ product }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { currentUser } = useAuthStore()
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [form, setForm] = React.useState(() => initialForm(product))

  const amount = Number(form.proposed_amount || 0)
  const deposit = amount * (Number(form.deposit_percentage || 0) / 100)
  const balance = Math.max(amount - deposit, 0)
  const platformFee = Math.min(Math.max(amount * 0.05, 5000), amount)
  const artistPayout = Math.max(amount - platformFee, 0)

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!currentUser) {
      navigate("/users/sign_in")
      return
    }

    setSubmitting(true)

    const payload = {
      ...form,
      service_product_id: product.id,
      starts_at: toDateTime(form.event_date, form.start_time),
      ends_at: toDateTime(form.event_date, form.end_time),
    }

    delete payload.start_time
    delete payload.end_time

    try {
      const response = await post("/service_booking_proposals.json", {
        responseKind: "json",
        body: { service_booking_proposal: payload },
      })
      const result = await response.json

      if (response.ok) {
        setOpen(false)
        navigate(`/service_booking_proposals/${result.service_booking_proposal.id}`)
      } else {
        toast({
          variant: "destructive",
          title: I18n.t("service_booking_proposals.messages.error"),
          description: Object.values(result.errors || {}).flat().join(", "),
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: I18n.t("service_booking_proposals.messages.error"),
        description: I18n.t("service_booking_proposals.form.submit_error"),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Send className="mr-2 h-4 w-4" />
          {I18n.t("service_booking_proposals.form.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{I18n.t("service_booking_proposals.form.title")}</DialogTitle>
          <DialogDescription>
            {I18n.t("service_booking_proposals.form.description", { artist: product.user.name })}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposal_event_name">{I18n.t("service_booking_proposals.form.event_name")}</Label>
              <Input
                id="proposal_event_name"
                value={form.event_name}
                onChange={(event) => update("event_name", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_event_date">{I18n.t("service_booking_proposals.form.event_date")}</Label>
              <Input
                id="proposal_event_date"
                type="date"
                value={form.event_date}
                onChange={(event) => update("event_date", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_start_time">{I18n.t("service_booking_proposals.form.start_time")}</Label>
              <Input
                id="proposal_start_time"
                type="time"
                value={form.start_time}
                onChange={(event) => update("start_time", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_end_time">{I18n.t("service_booking_proposals.form.end_time")}</Label>
              <Input
                id="proposal_end_time"
                type="time"
                value={form.end_time}
                onChange={(event) => update("end_time", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_venue_name">{I18n.t("service_booking_proposals.form.venue_name")}</Label>
              <Input
                id="proposal_venue_name"
                value={form.venue_name}
                onChange={(event) => update("venue_name", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_venue_address">{I18n.t("service_booking_proposals.form.venue_address")}</Label>
              <Input
                id="proposal_venue_address"
                value={form.venue_address}
                onChange={(event) => update("venue_address", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_city">{I18n.t("service_booking_proposals.form.city")}</Label>
              <Input
                id="proposal_city"
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_country">{I18n.t("service_booking_proposals.form.country")}</Label>
              <Input
                id="proposal_country"
                value={form.country}
                onChange={(event) => update("country", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>{I18n.t("service_booking_proposals.form.fee_type")}</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {feeTypes.map((feeType) => {
                const Icon = feeType.icon
                const selected = form.fee_type === feeType.value

                return (
                  <button
                    key={feeType.value}
                    type="button"
                    onClick={() => update("fee_type", feeType.value)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="mb-3 h-5 w-5" />
                    <div className="font-medium">{feeType.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{feeType.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="proposal_amount">{I18n.t("service_booking_proposals.form.amount")}</Label>
                <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
                  {form.currency || "clp"}
                </span>
              </div>
              <Input
                id="proposal_amount"
                type="number"
                min="1"
                value={form.proposed_amount}
                onChange={(event) => update("proposed_amount", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_deposit">{I18n.t("service_booking_proposals.form.deposit_percentage")}</Label>
              <Input
                id="proposal_deposit"
                type="number"
                min="0"
                max="100"
                value={form.deposit_percentage}
                onChange={(event) => update("deposit_percentage", event.target.value)}
                required
              />
            </div>
            <div className="rounded-lg border border-border p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Music2 className="h-4 w-4" />
                {I18n.t("service_booking_proposals.form.payment_preview")}
              </div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>{I18n.t("service_booking_proposals.form.deposit_amount")}</span>
                <strong className="text-right text-foreground">{currency(deposit, form.currency)}</strong>
                <span>{I18n.t("service_booking_proposals.form.balance_amount")}</span>
                <strong className="text-right text-foreground">{currency(balance, form.currency)}</strong>
                <span>{I18n.t("service_booking_proposals.form.artist_fee")}</span>
                <strong className="text-right text-foreground">{currency(platformFee, form.currency)}</strong>
                <span>{I18n.t("service_booking_proposals.form.artist_payout")}</span>
                <strong className="text-right text-foreground">{currency(artistPayout, form.currency)}</strong>
              </div>
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
                  id={`proposal_${field}`}
                  checked={Boolean(form[field])}
                  onCheckedChange={(checked) => update(field, checked === true)}
                />
                <Label htmlFor={`proposal_${field}`} className="text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="proposal_guest_list" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {I18n.t("service_booking_proposals.form.guest_list_count")}
              </Label>
              <Input
                id="proposal_guest_list"
                type="number"
                min="0"
                value={form.guest_list_count}
                onChange={(event) => update("guest_list_count", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposal_benefits">{I18n.t("service_booking_proposals.form.benefits")}</Label>
              <Textarea
                id="proposal_benefits"
                value={form.benefits}
                onChange={(event) => update("benefits", event.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal_technical_notes">{I18n.t("service_booking_proposals.form.technical_notes")}</Label>
              <Textarea
                id="proposal_technical_notes"
                value={form.technical_notes}
                onChange={(event) => update("technical_notes", event.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal_message">{I18n.t("service_booking_proposals.form.message")}</Label>
            <Textarea
              id="proposal_message"
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {I18n.t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {I18n.t("service_booking_proposals.form.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
