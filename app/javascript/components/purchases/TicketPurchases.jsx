import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Ticket } from "lucide-react"
import { formatDistance } from "date-fns"
import { Button } from "@/components/ui/button"
import EventTicketModal from "../event_tickets/EventTicketModal"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

function TicketPurchaseDetails({ purchase, onClose, onViewTicket }) {
  if (!purchase) return null

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Purchase Details</SheetTitle>
        <SheetDescription>
          View your purchase information
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {purchase.purchased_items && purchase.purchased_items.map((item) => (
          <div key={item.id} className="space-y-4 p-4 border rounded-lg hover:bg-accent/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={item.purchased_item.cover_url} 
                    className="object-cover" 
                  />
                  <AvatarFallback>
                    {item.purchased_item.title?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-medium">{item.purchased_item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.purchased_item.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.purchased_item.description}
                  </p>
                </div>
              </div>

              {item.purchased_item.type === "EventTicket" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewTicket(item)}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  View Ticket
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={item.paid ? "success" : "secondary"}>
                  {item.state}
                </Badge>
              </div>

              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Purchased</span>
                <span className="text-sm">
                  {formatDistance(new Date(purchase.created_at), new Date(), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SheetContent>
  )
}

function TicketPurchaseItem({ purchase, onClick, onViewTicket }) {
  return (
    <div className="space-y-4">
      {purchase.purchased_items && purchase.purchased_items.map((item) => (
        <div 
          key={item.id} 
          className="flex items-center justify-between py-4 hover:bg-accent/50 rounded-lg px-4 border"
        >
          <div 
            className="flex items-center space-x-4 flex-grow cursor-pointer"
            onClick={() => onClick(purchase)}
          >
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
              <p className="text-sm text-muted-foreground">
                Type: {item.purchased_item.type}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.purchased_item.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistance(new Date(purchase.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={item.paid ? "success" : "secondary"}>
              {item.state}
            </Badge>

            {item.purchased_item.type === "EventTicket" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewTicket(item)
                }}
              >
                <Ticket className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TicketPurchases({ purchases, loading, lastElementRef }) {
  const [selectedPurchase, setSelectedPurchase] = React.useState(null)
  const [selectedTicket, setSelectedTicket] = React.useState(null)

  return (
    <>
      <Sheet open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
        <TicketPurchaseDetails 
          purchase={selectedPurchase} 
          onClose={() => setSelectedPurchase(null)}
          onViewTicket={(item) => {
            setSelectedPurchase(null)
            setSelectedTicket(item)
          }}
        />
      </Sheet>


      <EventTicketModal
        selectedTicket={selectedTicket}
        selectedPurchase={selectedPurchase}
        ticketId={selectedTicket?.signed_id}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        onUpdate={(result) => {
          // Update the ticket status in the purchases list
          const updatedPurchases = purchases.map(purchase => {
            if (purchase.id === selectedPurchase?.id) {
              return {
                ...purchase,
                purchased_items: purchase.purchased_items.map(item => {
                  if (item.purchased_item.id === result.event_ticket.id) {
                    return {
                      ...item,
                      checked_in_at: result.event_ticket.purchased_item.checked_in_at,
                      checked_in: result.event_ticket.purchased_item.checked_in
                    }
                  }
                  return item
                })
              }
            }
            return purchase
          })
          // Update the local state
          setSelectedTicket({
            ...selectedTicket,
            checked_in_at: result.event_ticket.purchased_item.checked_in_at,
            checked_in: result.event_ticket.purchased_item.checked_in
          })
        }}
      />


      <ScrollArea className="h-[600px] rounded-md border p-4">
        <div className="space-y-4">
          {purchases.map((purchase, idx) => (
            <div key={purchase.id} ref={idx === purchases.length - 1 ? lastElementRef : null}>
              <TicketPurchaseItem 
                purchase={purchase} 
                onClick={setSelectedPurchase}
                onViewTicket={setSelectedTicket}
              />
              {idx < purchases.length - 1 && <hr className="my-4 border-t" />}
            </div>
          ))}
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
