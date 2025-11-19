import React from "react"
import { motion } from "framer-motion"
import { CheckCircle, Loader2, Ticket } from "lucide-react"
import { Button } from "../ui/button"
import { Link, useParams } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import EventTicketModal from "../event_tickets/EventTicketModal"
import { get } from "@rails/request.js"
import I18n from '@/stores/locales'

export default function EventCheckoutSuccess() {
  const { purchase_id } = useParams()
  const [purchase, setPurchase] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [selectedTicket, setSelectedTicket] = React.useState(null)

  React.useEffect(() => {
    const fetchPurchase = async () => {
      if (!purchase_id) return

      try {
        const response = await get(`/purchases/${purchase_id}.json`)
        const data = await response.json
        setPurchase(data)
      } catch (err) {
        console.error("Error loading purchase", err)
        setError(I18n.t("events.purchase_success.load_error"))
      } finally {
        setLoading(false)
      }
    }

    fetchPurchase()
  }, [purchase_id])

  const title = I18n.t('products.checkout.success.title')
  const message = I18n.t('products.checkout.success.message')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full bg-card p-8 rounded-lg shadow-lg space-y-8"
      >
        {/* Header success state */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {message}
            </p>
          </motion.div>
        </div>

        {/* Purchase details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            {I18n.t("events.purchase_success.tickets_title")}
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>{I18n.t("events.purchase_success.loading")}</span>
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && purchase && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              {purchase.purchased_items && purchase.purchased_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0 gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage
                        src={item.purchased_item.cover_url}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {item.purchased_item.title?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.purchased_item.title}
                      </p>
                      {item.purchased_item.event && (
                        <p className="text-xs text-muted-foreground">
                          {item.purchased_item.event.title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {item.purchased_item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={item.paid ? "success" : "secondary"}>
                      {item.state}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {item.price} {item.currency?.toUpperCase()}
                    </p>

                    {item.purchased_item.type === "EventTicket" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTicket(item)}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        {I18n.t("events.purchase_success.view_ticket")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <EventTicketModal
          selectedTicket={selectedTicket}
          selectedPurchase={purchase}
          ticketId={selectedTicket?.signed_id}
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
        />

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/purchases/tickets">{I18n.t('products.checkout.success.view_orders')}</Link>
            </Button>

            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/">{I18n.t('products.checkout.success.continue_shopping')}</Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
