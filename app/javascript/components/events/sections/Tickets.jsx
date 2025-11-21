import React from "react"
import { useParams } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { get, put } from '@rails/request.js'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import I18n from '@/stores/locales'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Plus, Ticket, Trash2, Link2, Copy, CheckCircle2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "classnames"
import { formatDateSafely } from "@/hooks/safeDate"

const ticketSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, {
    message: I18n.t('events.edit.tickets.validation.title_min'),
  }),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0),
  qty: z.coerce.number().min(0),
  selling_start: z.preprocess((arg) => {
    if (typeof arg === 'string') return new Date(arg)
    if (arg instanceof Date) return arg
    return null
  }, z.date().nullable()),
  selling_end: z.preprocess((arg) => {
    if (typeof arg === 'string') return new Date(arg)
    if (arg instanceof Date) return arg
    return null
  }, z.date().nullable()),
  min_tickets_per_order: z.coerce.number().min(1).default(1),
  max_tickets_per_order: z.coerce.number().min(1).default(1),
  requires_shipping: z.boolean().default(false),
  show_remaining_count: z.boolean().default(true),
  show_sell_until: z.boolean().default(false),
  show_after_sold_out: z.boolean().default(true),
  hidden: z.boolean().default(false),
  disable_qr: z.boolean().default(false),
  after_purchase_message: z.string().optional(),
  sales_channel: z.enum(["all", "event_page", "box_office"]).default("all"),
  pay_what_you_want: z.boolean().default(false),
  minimum_price: z.coerce.number().min(0).optional(),
  _destroy: z.boolean().optional(),
  hidden_in_form: z.boolean().optional(),
})

const formSchema = z.object({
  ticket_currency: z.string().min(1),
  hide_location_until_purchase: z.boolean().default(false),
  tickets: z.array(ticketSchema),
})

const salesChannelOptions = [
  { value: "all", label: I18n.t('events.edit.tickets.form.sales_channel.options.all') },
  { value: "event_page", label: I18n.t('events.edit.tickets.form.sales_channel.options.event_page') },
  { value: "box_office", label: I18n.t('events.edit.tickets.form.sales_channel.options.box_office') },
]

const currencyLabels = {
  clp: I18n.t('events.edit.tickets.currency.clp'),
  usd: I18n.t('events.edit.tickets.currency.usd'),
  eur: I18n.t('events.edit.tickets.currency.eur'),
  gbp: I18n.t('events.edit.tickets.currency.gbp'),
  cad: I18n.t('events.edit.tickets.currency.cad'),
  aud: I18n.t('events.edit.tickets.currency.aud'),
  mxn: I18n.t('events.edit.tickets.currency.mxn'),
  brl: I18n.t('events.edit.tickets.currency.brl'),
  jpy: I18n.t('events.edit.tickets.currency.jpy'),
  nzd: I18n.t('events.edit.tickets.currency.nzd'),
}

const DEFAULT_CURRENCY_CODES = ["clp", "usd", "eur"]
const STRIPE_CURRENCY_CODES = Array.from(
  new Set([
    ...DEFAULT_CURRENCY_CODES,
    "gbp",
    "cad",
    "aud",
    "mxn",
    "brl",
    "jpy",
    "nzd",
  ]),
)

const DEFAULT_TICKET_CURRENCY = "usd"

export default function Tickets() {
  const { slug } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = React.useState(null)
  const [copiedTicketId, setCopiedTicketId] = React.useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticket_currency: DEFAULT_TICKET_CURRENCY,
      hide_location_until_purchase: false,
      tickets: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tickets"
  })

  const paymentGateway = React.useMemo(() => {
    if (!event) return null
    return event.payment_gateway || event.event_settings?.payment_gateway || null
  }, [event])

  const selectedCurrency = (form.watch("ticket_currency") || "").toLowerCase()

  const currencyOptions = React.useMemo(() => {
    const baseCodes = paymentGateway === "stripe" ? STRIPE_CURRENCY_CODES : DEFAULT_CURRENCY_CODES
    const codes = new Set(baseCodes)
    if (selectedCurrency) {
      codes.add(selectedCurrency)
    }

    return Array.from(codes).map((code) => ({
      value: code,
      label: currencyLabels[code] || code.toUpperCase(),
    }))
  }, [paymentGateway, selectedCurrency])

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await get(`/events/${slug}/edit.json`)
        const data = await response.json

        setEvent(data)

        console.log('Fetched tickets data:', data)
        // Reset form with current tickets
        form.reset({
          ticket_currency: (data.ticket_currency || DEFAULT_TICKET_CURRENCY).toLowerCase(),
          hide_location_until_purchase: data.event_settings?.hide_location_until_purchase || false,
          tickets: data.tickets?.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            short_description: ticket.short_description,
            price: ticket.price,
            qty: ticket.qty,
            selling_start: formatDateSafely(ticket.selling_start),
            selling_end: formatDateSafely(ticket.selling_end),
            min_tickets_per_order: ticket.settings.min_tickets_per_order,
            max_tickets_per_order: ticket.settings.max_tickets_per_order,
            requires_shipping: ticket.requires_shipping,
            show_remaining_count: ticket.show_remaining_count,
            show_sell_until: ticket.settings.show_sell_until,
            show_after_sold_out: ticket.settings.show_after_sold_out,
            hidden: ticket.settings.hidden,
            disable_qr: ticket.settings.disable_qr || false,
            after_purchase_message: ticket.settings.after_purchase_message,
            sales_channel: ticket.settings.sales_channel,
            pay_what_you_want: ticket.settings.pay_what_you_want || false,
            minimum_price: ticket.settings.minimum_price || 0,
          })) || []
        })
      } catch (error) {
        console.error('Error fetching tickets:', error)
        toast({
          title: I18n.t('events.edit.tickets.messages.error'),
          description: I18n.t('events.edit.tickets.messages.load_error'),
          variant: "destructive",
        })
      }
    }

    fetchTickets()
  }, [slug])

  const addTicket = () => {
    append({
      title: "",
      short_description: "",
      price: 0,
      qty: 1,
      selling_start: new Date(),
      selling_end: new Date(),
      min_tickets_per_order: 1,
      max_tickets_per_order: 1,
      requires_shipping: false,
      show_remaining_count: true,
      show_sell_until: false,
      show_after_sold_out: true,
      hidden: false,
      disable_qr: false,
      after_purchase_message: "",
      sales_channel: "all",
      pay_what_you_want: false,
      minimum_price: 0,
    })
  }

  const removeTicket = (index) => {
    const ticket = form.getValues(`tickets.${index}`)
    if (ticket.id) {
      // If ticket has an ID, mark it for destruction instead of removing
      form.setValue(`tickets.${index}._destroy`, true)
      // Optionally hide the ticket in the UI
      form.setValue(`tickets.${index}.hidden_in_form`, true)
    } else {
      // If it's a new ticket (no ID), just remove it from the form
      remove(index)
    }
  }

  const generateSecretLink = async (ticketId) => {
    try {
      const response = await get(`/events/${slug}/event_tickets/${ticketId}/secret_link.json`)
      const data = await response.json

      if (data.secret_url) {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.secret_url)

        setCopiedTicketId(ticketId)
        setTimeout(() => setCopiedTicketId(null), 2000)

        toast({
          title: I18n.t('events.edit.tickets.messages.link_copied', { defaultValue: 'Link Copied!' }),
          description: I18n.t('events.edit.tickets.messages.link_copied_description', { defaultValue: 'The secret link has been copied to your clipboard. Share it with the people you want to have access to this ticket.' }),
        })
      }
    } catch (error) {
      console.error('Error generating secret link:', error)
      toast({
        title: I18n.t('events.edit.tickets.messages.error', { defaultValue: 'Error' }),
        description: I18n.t('events.edit.tickets.messages.link_generation_error', { defaultValue: 'There was an error generating the secret link. Please make sure the ticket is saved first.' }),
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data) => {
    try {
      const ticketCurrency = (data.ticket_currency || DEFAULT_TICKET_CURRENCY).toLowerCase()

      const formattedData = {
        ...data,
        ticket_currency: ticketCurrency,
        tickets: data.tickets.map(ticket => ({
          ...ticket,
          selling_start: ticket.selling_start ? ticket.selling_start.toISOString() : null,
          selling_end: ticket.selling_end ? ticket.selling_end.toISOString() : null,
        }))
      }

      const response = await put(`/events/${slug}.json`, {
        body: JSON.stringify({
          event: {
            ticket_currency: formattedData.ticket_currency,
            hide_location_until_purchase: data.hide_location_until_purchase,
            event_tickets_attributes: formattedData.tickets
          }
        }),
        responseKind: 'json'
      })

      const responseData = await response.json

      if (response.ok && !responseData.errors) {
        toast({
          title: I18n.t('events.edit.tickets.messages.success'),
          description: I18n.t('events.edit.tickets.messages.update_success'),
        })
      } else {
        // Handle nested errors
        Object.keys(responseData.errors || {}).forEach(key => {
          const match = key.match(/event_tickets_attributes\.(\d+)\.(.+)/)
          if (match) {
            const [_, index, field] = match
            form.setError(`tickets.${index}.${field}`, {
              type: 'server',
              message: responseData.errors[key][0]
            })
          } else {
            // Handle non-nested errors if any
            form.setError(key, {
              type: 'server',
              message: responseData.errors[key][0]
            })
          }
        })

        toast({
          title: I18n.t('events.edit.tickets.messages.error'),
          description: I18n.t('events.edit.tickets.messages.update_error_check_form'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating tickets:', error)
      toast({
        title: I18n.t('events.edit.tickets.messages.error'),
        description: I18n.t('events.edit.tickets.messages.update_error'),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{I18n.t('events.edit.tickets.title')}</CardTitle>
              <CardDescription>
                {I18n.t('events.edit.tickets.description')}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addTicket}
            >
              <Plus className="h-4 w-4 mr-2" />
              {I18n.t('events.edit.tickets.add_ticket')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="ticket_currency"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>{I18n.t('events.edit.tickets.ticket_currency.label')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value.toLowerCase())}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={I18n.t('events.edit.tickets.ticket_currency.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyOptions.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {I18n.t('events.edit.tickets.ticket_currency.description')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hide_location_until_purchase"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm max-w-2xl">
                    <div className="space-y-0.5">
                      <FormLabel>
                        {I18n.t('events.edit.tickets.hide_location_until_purchase.label')}
                      </FormLabel>
                      <FormDescription>
                        {I18n.t('events.edit.tickets.hide_location_until_purchase.description')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {fields.map((field, index) => {
                // Skip rendering tickets marked for destruction
                if (form.getValues(`tickets.${index}.hidden_in_form`)) {
                  return null
                }

                return (
                  <Card key={field.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          <CardTitle className="text-lg">
                            {field.title || I18n.t('events.edit.tickets.new_ticket')}
                          </CardTitle>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTicket(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Basic Info */}
                          <FormField
                            control={form.control}
                            name={`tickets.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.title.label')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={I18n.t('events.edit.tickets.form.title.placeholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`tickets.${index}.short_description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.description.label')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={I18n.t('events.edit.tickets.form.description.placeholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Pricing and Quantity */}
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`tickets.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.price.label')}</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`tickets.${index}.qty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.qty.label')}</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Pay What You Want */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`tickets.${index}.pay_what_you_want`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>{I18n.t('events.edit.tickets.form.pay_what_you_want.label')}</FormLabel>
                                  <FormDescription>
                                    {I18n.t('events.edit.tickets.form.pay_what_you_want.description')}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {form.watch(`tickets.${index}.pay_what_you_want`) && (
                            <FormField
                              control={form.control}
                              name={`tickets.${index}.minimum_price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{I18n.t('events.edit.tickets.form.minimum_price.label')}</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    {I18n.t('events.edit.tickets.form.minimum_price.description')}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Sales Period */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`tickets.${index}.selling_start`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.sale_start.label')}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    {...field}
                                    value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                    onChange={(e) => {
                                      const date = e.target.value ? new Date(e.target.value) : null
                                      field.onChange(date)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`tickets.${index}.selling_end`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.sale_end.label')}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    {...field}
                                    value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                                    onChange={(e) => {
                                      const date = e.target.value ? new Date(e.target.value) : null
                                      field.onChange(date)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Order Limits */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`tickets.${index}.min_tickets_per_order`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.min_tickets_per_order.label')}</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`tickets.${index}.max_tickets_per_order`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{I18n.t('events.edit.tickets.form.max_tickets_per_order.label')}</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Display Options */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`tickets.${index}.show_sell_until`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>{I18n.t('events.edit.tickets.form.show_sell_until.label')}</FormLabel>
                                    <FormDescription>
                                      {I18n.t('events.edit.tickets.form.show_sell_until.description')}
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`tickets.${index}.show_after_sold_out`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>{I18n.t('events.edit.tickets.form.show_after_sold_out.label')}</FormLabel>
                                    <FormDescription>
                                      {I18n.t('events.edit.tickets.form.show_after_sold_out.description')}
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`tickets.${index}.hidden`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>{I18n.t('events.edit.tickets.form.hidden.label')}</FormLabel>
                                    <FormDescription>
                                      {I18n.t('events.edit.tickets.form.hidden.description')}
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`tickets.${index}.disable_qr`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>{I18n.t('events.edit.tickets.form.disable_qr.label')}</FormLabel>
                                    <FormDescription>
                                      {I18n.t('events.edit.tickets.form.disable_qr.description')}
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {form.watch(`tickets.${index}.hidden`) && form.getValues(`tickets.${index}.id`) && (
                              <div className="rounded-lg border p-3 shadow-sm space-y-2">
                                <div className="space-y-0.5">
                                  <FormLabel className="flex items-center gap-2">
                                    <Link2 className="h-4 w-4" />
                                    {I18n.t('events.edit.tickets.form.secret_link.label', { defaultValue: 'Secret Link' })}
                                  </FormLabel>
                                  <FormDescription>
                                    {I18n.t('events.edit.tickets.form.secret_link.description', { defaultValue: 'Generate a secret link to share this hidden ticket with specific people' })}
                                  </FormDescription>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => generateSecretLink(form.getValues(`tickets.${index}.id`))}
                                >
                                  {copiedTicketId === form.getValues(`tickets.${index}.id`) ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      {I18n.t('events.edit.tickets.form.secret_link.copied', { defaultValue: 'Copied!' })}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-2" />
                                      {I18n.t('events.edit.tickets.form.secret_link.button', { defaultValue: 'Generate & Copy Link' })}
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`tickets.${index}.after_purchase_message`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{I18n.t('events.edit.tickets.form.after_purchase_message.label')}</FormLabel>
                                  <FormDescription>
                                    {I18n.t('events.edit.tickets.form.after_purchase_message.description')}
                                  </FormDescription>
                                  <FormControl>
                                    <Textarea {...field} className="h-[120px]" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`tickets.${index}.sales_channel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{I18n.t('events.edit.tickets.form.sales_channel.label')}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={I18n.t('events.edit.tickets.form.sales_channel.placeholder')} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {salesChannelOptions.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {fields.length > 0 && (
                <Button type="submit">{I18n.t('events.edit.tickets.save_tickets')}</Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
