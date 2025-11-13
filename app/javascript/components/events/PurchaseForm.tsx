import * as React from "react"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { get, post } from "@rails/request.js"
import { motion, AnimatePresence } from "framer-motion"
import { Ticket, ShoppingCart, AlertCircle, Info } from "lucide-react"
import I18n from "@/stores/locales"
import { Badge } from "../ui/badge"

interface Ticket {
  id: string
  title: string
  price: number
  short_description: string
  quantity: number
  min_tickets_per_order?: number
  max_tickets_per_order?: number
  pay_what_you_want?: boolean
  minimum_price?: number
  sold_out?: boolean
}

interface Event {
  id: string
  title: string
  ticket_currency: string
}

interface PurchaseFormProps {
  eventId: string
  ticketToken?: string
}

type TicketFormValues = Record<string, number>

export default function PurchaseForm({ eventId, ticketToken }: PurchaseFormProps) {
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [loading, setLoading] = React.useState(false)
  const [event, setEvent] = React.useState<Event | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TicketFormValues>()

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const url = ticketToken 
          ? `/events/${eventId}/event_purchases/new.json?ticket_token=${encodeURIComponent(ticketToken)}`
          : `/events/${eventId}/event_purchases/new.json`
        const response = await get(url)
        const data = await response.json
        setEvent(data.event)
        const parseOrderLimit = (value: unknown) => {
          const numericValue = Number(value)
          return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined
        }
        const normalizedTickets: Ticket[] = data.tickets.map((ticket: Ticket) => {

          const min_tickets_per_order = parseOrderLimit(ticket.min_tickets_per_order)
          const max_tickets_per_order = parseOrderLimit(ticket.max_tickets_per_order)

          // Normalize Rails `sold_out?` boolean into `sold_out`
          const sold_out = !!((ticket as any)["sold_out?"] || (ticket as any).sold_out)

          return {
            ...ticket,
            min_tickets_per_order,
            max_tickets_per_order,
            sold_out,
          }
        })

        setTickets(normalizedTickets)
      } catch (error) {
        toast({
          variant: "destructive",
          title: I18n.t("events.purchase_form.toast.error.title"),
          description: I18n.t("events.purchase_form.toast.error.load_tickets"),
        })
      }
    }

    fetchTickets()
  }, [eventId, ticketToken])

  React.useEffect(() => {
    tickets.forEach((ticket) => {
      const fieldName = ticket.id.toString()
      if (ticket.pay_what_you_want) {
        setValue(`${fieldName}_quantity`, 0)
        setValue(`${fieldName}_custom_price`, ticket.minimum_price || 0)
      } else {
        setValue(fieldName, 0)
      }
    })
  }, [tickets, setValue])

  const parseQuantity = (value: any): number => {
    return typeof value === "number" ? value : parseInt(value as string, 10)
  }

  const parsePrice = (value: any): number => {
    return typeof value === "number" ? value : parseFloat(value as string)
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const ticketsData = tickets.map(ticket => {
        if (ticket.pay_what_you_want) {
          const quantity = data[`${ticket.id}_quantity`]
          const customPrice = data[`${ticket.id}_custom_price`]
          return {
            id: ticket.id,
            quantity: parseQuantity(quantity),
            custom_price: parsePrice(customPrice),
          }
        } else {
          const quantity = data[ticket.id]
          return {
            id: ticket.id,
            quantity: parseQuantity(quantity),
          }
        }
      }).filter(ticket => ticket.quantity > 0)

      const response = await post(`/events/${eventId}/event_purchases.json`, {
        body: JSON.stringify({
          tickets: ticketsData,
        }),
      })
      
      const result = await response.json
      
      if (Array.isArray(result.errors) && result.errors.length > 0) {
        toast({
          variant: "destructive",
          title: I18n.t("events.purchase_form.toast.error.title"),
          description: result.errors.join("\n"),
        })
        return
      }
      
      // Redirect to payment URL if provided
      if (result.payment_url) {
        window.location.href = result.payment_url
      } else {
        // navigate(`/events/${eventId}/event_purchases/${result.id}`)
        navigate("/purchases/tickets")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: I18n.t("events.purchase_form.toast.error.title"),
        description: I18n.t("events.purchase_form.toast.error.process_purchase"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-card/95 backdrop-blur-lg shadow-xl border-none">
        <CardHeader className="space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <Ticket className="w-6 h-6 text-primary" />
            <CardTitle>{I18n.t("events.purchase_form.title")}</CardTitle>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <CardDescription>{I18n.t("events.purchase_form.subtitle")}</CardDescription>
          </motion.div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 overflow-auto max-h-96">
            <AnimatePresence>
              {tickets.map((ticket, index) => {
                const isPWYW = ticket.pay_what_you_want === true
                const quantityFieldName = isPWYW ? `${ticket.id}_quantity` : ticket.id.toString()
                const priceFieldName = `${ticket.id}_custom_price`
                
                const quantity = watch(quantityFieldName) ?? 0
                const numericQuantity = Number(quantity)
                const parsedQuantity = Number.isNaN(numericQuantity) ? 0 : numericQuantity
                const minPerOrder = ticket.min_tickets_per_order ?? 0
                const maxPerOrder = ticket.max_tickets_per_order
                const hasMaxPerOrder = typeof maxPerOrder === "number"
                const rawMaxAllowed = hasMaxPerOrder ? Math.min(ticket.quantity, maxPerOrder) : ticket.quantity
                const effectiveMax = rawMaxAllowed
                const maxValidationKey =
                  hasMaxPerOrder && maxPerOrder < ticket.quantity
                    ? "events.purchase_form.validation.max_tickets_per_order"
                    : "events.purchase_form.validation.max_tickets"

                const customPrice = isPWYW ? (watch(priceFieldName) ?? ticket.minimum_price ?? 0) : null

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-muted/30 rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Label htmlFor={ticket.id} className="text-lg font-semibold">
                          {ticket.title}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {ticket.short_description}
                        </p>
                        {isPWYW && (
                          <p className="text-xs text-primary font-medium">
                            {I18n.t("events.purchase_form.pay_what_you_want_min", { 
                              currency: event?.ticket_currency?.toUpperCase(), 
                              min_price: ticket.minimum_price || 0 
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {isPWYW ? (
                            <span className="text-sm">{I18n.t("events.purchase_form.pay_what_you_want_label")}</span>
                          ) : (
                            I18n.t("events.purchase_form.price", { 
                              price: `${event?.ticket_currency?.toUpperCase()} ${ticket.price}` 
                            })
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {I18n.t("events.purchase_form.available_tickets", { count: ticket.quantity })}
                        </div>
                      </div>
                    </div>

                    {/* Custom Price Input for PWYW */}
                    {isPWYW && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          {I18n.t("events.purchase_form.your_price_label", { 
                            currency: event?.ticket_currency?.toUpperCase() 
                          })}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={ticket.minimum_price || 0}
                          className="text-center font-medium text-lg"
                          {...register(priceFieldName, {
                            valueAsNumber: true,
                            min: {
                              value: ticket.minimum_price || 0,
                              message: I18n.t("events.purchase_form.minimum_price_error", { 
                                currency: event?.ticket_currency?.toUpperCase(), 
                                min_price: ticket.minimum_price || 0 
                              }),
                            },
                          })}
                          defaultValue={ticket.minimum_price || 0}
                        />
                        {errors[priceFieldName] && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-sm text-destructive"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors[priceFieldName]?.message as string}</span>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {ticket.sold_out ? (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          {I18n.t("events.purchase_form.quantity_label")}
                        </Label>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-destructive" />
                          
                          <Badge variant="destructive">
                            {I18n.t("events.purchase_form.sold_out_badge")}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          {I18n.t("events.purchase_form.quantity_label")}
                        </Label>
                        <div className="flex items-center justify-center gap-3 bg-background/50 rounded-lg p-2">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted transition-colors"
                            onClick={() => {
                              let updatedValue = Math.max(0, parsedQuantity - 1)

                              if (minPerOrder > 0 && updatedValue > 0 && updatedValue < minPerOrder) {
                                updatedValue = 0
                              }

                              setValue(quantityFieldName, updatedValue, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              })
                            }}
                          >
                            <motion.div
                              initial={{ opacity: 0.5 }}
                              whileHover={{ opacity: 1 }}
                              className="text-lg font-bold"
                            >
                              -
                            </motion.div>
                          </motion.button>

                          <div className="relative w-20">
                            <Input
                              type="number"
                              id={ticket.id}
                              className="text-center font-medium text-lg !px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              {...register(quantityFieldName, {
                                valueAsNumber: true,
                                min: {
                                  value: 0,
                                  message: I18n.t("events.purchase_form.validation.quantity_negative"),
                                },
                                max: {
                                  value: effectiveMax,
                                  message: I18n.t(maxValidationKey, { count: effectiveMax }),
                                },
                                validate: (value) => {
                                  if (Number.isNaN(value) || value === 0) {
                                    return true
                                  }

                                  if (minPerOrder > 0 && value < minPerOrder) {
                                    return I18n.t("events.purchase_form.validation.min_tickets_per_order", {
                                      count: minPerOrder,
                                    })
                                  }

                                  return true
                                },
                              })}
                              defaultValue={0}
                              min={0}
                              max={effectiveMax}
                            />
                          </div>

                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted transition-colors"
                            onClick={() => {
                              let updatedValue = parsedQuantity + 1

                              if (parsedQuantity === 0 && minPerOrder > 0 && updatedValue < minPerOrder) {
                                updatedValue = minPerOrder
                              }

                              if (minPerOrder > 0 && updatedValue > 0 && updatedValue < minPerOrder) {
                                updatedValue = minPerOrder
                              }

                              updatedValue = Math.min(effectiveMax, updatedValue)

                              if (minPerOrder > 0 && updatedValue > 0 && updatedValue < minPerOrder) {
                                updatedValue = 0
                              }

                              setValue(quantityFieldName, updatedValue, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              })
                            }}
                          >
                            <motion.div
                              initial={{ opacity: 0.5 }}
                              whileHover={{ opacity: 1 }}
                              className="text-lg font-bold"
                            >
                              +
                            </motion.div>
                          </motion.button>
                        </div>

                        {errors[quantityFieldName] && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-sm text-destructive"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors[quantityFieldName]?.message as string}</span>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </CardContent>

          {/* Disclaimers Section */}
          <div className="px-6 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-muted/30 rounded-lg p-4 space-y-3 border border-muted"
            >
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {I18n.t("events.purchase_form.disclaimers.title")}
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{I18n.t("events.purchase_form.disclaimers.refund_policy")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{I18n.t("events.purchase_form.disclaimers.platform_role")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          <CardFooter>
            <Button
              type="submit"
              className="w-full relative overflow-hidden group"
              disabled={loading}
            >
              <motion.div
                className="flex items-center justify-center gap-2"
                animate={loading ? { opacity: 0 } : { opacity: 1 }}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{I18n.t("events.purchase_form.purchase_button")}</span>
              </motion.div>
              
              {loading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="ml-2">{I18n.t("events.purchase_form.processing")}</span>
                </motion.div>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
