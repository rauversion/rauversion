import React from 'react'
import { get, put } from '@rails/request.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EventTicketModal({ selectedTicket, selectedPurchase, ticketId, open, onOpenChange, onUpdate }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['event_ticket', ticketId],
    queryFn: async () => {
      const response = await get(`/events/${selectedTicket?.purchased_item?.event?.slug}/event_tickets/${ticketId}.json`)
      return response.json
    },
    enabled: !!ticketId && open
  })
  console.log(data)

  return (
    < Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Event Ticket</DialogTitle>
          <DialogDescription>
            View your event ticket details
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : data?.event_ticket && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="relative border-2 border-primary/20 shadow-xl bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 opacity-0"
                  animate={{
                    background: [
                      "linear-gradient(45deg, transparent 0%, transparent 45%, rgba(255,255,255,0.15) 50%, transparent 55%, transparent 100%)",
                      "linear-gradient(45deg, transparent 0%, transparent 45%, rgba(255,255,255,0.15) 50%, transparent 55%, transparent 100%)"
                    ],
                    backgroundPosition: ["200% 50%", "-100% 50%"],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />

                <CardHeader className="relative z-10">
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                      {data.event_ticket.event.title}
                    </h2>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant={data.event_ticket.purchased_item?.paid ? "success" : "secondary"}
                        className="text-sm font-medium"
                      >
                        {data.event_ticket.purchased_item?.state}
                      </Badge>
                    </motion.div>
                  </motion.div>
                </CardHeader>

                {data.event_ticket.is_manager && (
                  <div className="mb-5 px-6 py-4 relative z-10 border-b border-primary/10">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                        Ticket Status: {" "}
                        <span className={data.event_ticket.purchased_item?.checked_in ? "text-green-500" : "text-yellow-500"}>
                          {data.event_ticket.purchased_item?.checked_in ? "CHECKED IN" : "NOT CHECKED IN"}
                        </span>
                      </h3>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={async () => {
                            try {
                              const response = await put(
                                `/events/${selectedTicket?.purchased_item?.event?.slug}/event_tickets/${ticketId}.json`, {
                                body: JSON.stringify({
                                  checked_in: !data.event_ticket.purchased_item?.checked_in
                                })
                              })

                              if (response.ok) {
                                const result = await response.json
                                // Update the cache with new data
                                queryClient.setQueryData(['event_ticket', ticketId], result)
                                onUpdate?.(result)
                                toast({
                                  title: "Success",
                                  description: `Ticket ${result.event_ticket.purchased_item?.checked_in ? "checked in" : "unchecked"} successfully`,
                                })
                              }
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update ticket status",
                              })
                            }
                          }}
                          variant="outline"
                          className="bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10"
                        >
                          {data.event_ticket.purchased_item?.checked_in ? "Uncheck" : "Confirm Check in"}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                )}

                <CardContent className="space-y-6 relative z-10">
                  <motion.div
                    className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {data.event_ticket.purchased_item?.paid && (
                      <motion.div
                        className="flex-shrink-0 bg-gradient-to-br from-green-100/80 to-green-200/50 dark:from-green-900/80 dark:to-green-800/50 p-6 rounded-lg shadow-lg"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.img
                          src={data.event_ticket.purchased_item.qr}
                          alt="QR Code"
                          className="w-48 h-48 sm:w-40 sm:h-40 lg:w-56 lg:h-56 object-contain"
                          initial={{ opacity: 0, rotate: -5 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          transition={{ delay: 0.5 }}
                        />
                      </motion.div>
                    )}

                    <motion.div
                      className="flex-grow space-y-4 text-center sm:text-left"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                          {data.event_ticket.purchased_item?.purchase?.user?.email}
                        </h3>
                      </motion.div>

                      <motion.div
                        className="space-y-2"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-primary/70">
                          TICKET: {data.event_ticket.title}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: data.event_ticket.event.ticket_currency,
                            minimumFractionDigits: data.event_ticket.event.presicion_for_currency
                          }).format(data.event_ticket.purchased_item.price)}
                          {' '}
                          {data.event_ticket.event.ticket_currency}
                        </div>
                      </motion.div>

                      <motion.div
                        className="space-y-2"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="text-sm text-muted-foreground font-medium">
                          {data.event_ticket.event.event_dates}
                        </div>
                        <div className="text-sm font-semibold">
                          {data.event_ticket.event.location}
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </CardContent>

                <CardFooter className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10"
                    >
                      <a href={`/events/${data.event_ticket.event.slug}`} target="_blank" rel="noopener noreferrer">
                        View Event
                      </a>
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog >
  )
}
