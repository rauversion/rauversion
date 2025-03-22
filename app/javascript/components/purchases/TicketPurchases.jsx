import React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { formatDistance } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

function TicketPurchaseDetails({ purchase, onClose }) {
  if (!purchase) return null

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Ticket Details</SheetTitle>
        <SheetDescription>
          View your ticket purchase information
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {purchase.purchased_items && purchase.purchased_items.map((item) => (
          <div key={item.id} className="space-y-4">
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
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={purchase.state === "paid" ? "success" : "secondary"}>
                  {purchase.state || purchase.status}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <Badge variant="outline">
                  ${purchase.price || purchase.total_amount}
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

function TicketPurchaseItem({ purchase, onClick }) {
  return (
    <div 
      className="flex items-center justify-between py-4 cursor-pointer hover:bg-accent/50 rounded-lg px-2"
      onClick={() => onClick(purchase)}
    >
      <div className="flex items-center space-x-4">
        {purchase.purchased_items && purchase.purchased_items.map((item) => (
          <div key={item.id} className="flex items-center space-x-4">
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
              <p className="text-xs text-muted-foreground">
                {formatDistance(new Date(purchase.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        {purchase.price && (
          <Badge variant={purchase.state === "paid" ? "success" : "secondary"}>
            {purchase.state}
          </Badge>
        )}

        {purchase.total_amount && (
          <Badge variant={purchase.status === "completed" ? "success" : "secondary"}>
            {purchase.status}
          </Badge>
        )}  

        {purchase.price && (
          <Badge variant="outline">${purchase.price}</Badge>
        )}

        {purchase.total_amount && (
          <Badge variant="outline">${purchase.total_amount}</Badge>
        )}
      </div>
    </div>
  )
}

export default function TicketPurchases({ purchases, loading, lastElementRef }) {
  const [selectedPurchase, setSelectedPurchase] = React.useState(null)
  return (
    <>
      <Sheet open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
        <TicketPurchaseDetails 
          purchase={selectedPurchase} 
          onClose={() => setSelectedPurchase(null)} 
        />
      </Sheet>

      <ScrollArea className="h-[600px] rounded-md border p-4">
      <div className="space-y-4">
        {purchases.map((purchase, idx) => (
          <div key={purchase.id} ref={idx === purchases.length - 1 ? lastElementRef : null}>
            <TicketPurchaseItem 
              purchase={purchase} 
              onClick={setSelectedPurchase}
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
