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
import { Ticket, ShoppingCart, AlertCircle } from "lucide-react"
import I18n from "@/stores/locales"

interface Ticket {
  id: string
  title: string
  price: number
  short_description: string
  quantity: number
}

interface PurchaseFormProps {
  eventId: string
}

export default function PurchaseForm({ eventId }: PurchaseFormProps) {
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await get(`/events/${eventId}/event_purchases/new.json`)
        const data = await response.json
        setTickets(data.tickets)
      } catch (error) {
        toast({
          variant: "destructive",
          title: I18n.t("events.purchase_form.toast.error.title"),
          description: I18n.t("events.purchase_form.toast.error.load_tickets"),
        })
      }
    }

    fetchTickets()
  }, [eventId])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await post(`/events/${eventId}/event_purchases.json`, {
        body: JSON.stringify({
          tickets: Object.entries(data).map(([id, quantity]) => ({
            id,
            quantity: parseInt(quantity as string, 10),
          })),
        }),
      })
      
      const result = await response.json
      
      // Redirect to payment URL if provided
      if (result.payment_url) {
        window.location.href = result.payment_url
      } else {
        navigate(`/events/${eventId}/event_purchases/${result.id}`)
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
      <Card className="bg-card/95 backdrop-blur-lg shadow-xl">
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
          <CardContent className="space-y-6">
            <AnimatePresence>
              {tickets.map((ticket, index) => (
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
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {I18n.t("events.purchase_form.price", { price: ticket.price })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {I18n.t("events.purchase_form.available_tickets", { count: ticket.quantity })}
                      </div>
                    </div>
                  </div>
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
                          const currentValue = parseInt(ticket.id.toString()) || 0;
                          if (currentValue > 0) {
                            const input = document.getElementById(ticket.id) as HTMLInputElement;
                            if (input) {
                              input.value = (currentValue - 1).toString();
                              input.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                          }
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
                          {...register(ticket.id.toString(), {
                            min: { 
                              value: 0, 
                              message: I18n.t("events.purchase_form.validation.quantity_negative") 
                            },
                            max: {
                              value: ticket.quantity,
                              message: I18n.t("events.purchase_form.validation.max_tickets", { count: ticket.quantity }),
                            },
                          })}
                          defaultValue={0}
                          min={0}
                          max={ticket.quantity}
                        />
                      </div>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        onClick={() => {
                          const currentValue = parseInt(ticket.id.toString()) || 0;
                          if (currentValue < ticket.quantity) {
                            const input = document.getElementById(ticket.id) as HTMLInputElement;
                            if (input) {
                              input.value = (currentValue + 1).toString();
                              input.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                          }
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
                    
                    {errors[ticket.id.toString()] && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-sm text-destructive"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors[ticket.id.toString()]?.message as string}</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
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
