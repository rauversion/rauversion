import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { formatDistance } from "date-fns"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import TicketPurchases from "./TicketPurchases"

function PurchaseItem({ purchase }) {
  return (
    <div className="flex items-center justify-between py-4">
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

export default function MyPurchases() {
  const [tab, setTab] = React.useState("music")
  const {
    items: purchases,
    loading,
    lastElementRef,
    resetList,
    page,
    fetchItems,
  } = useInfiniteScroll(`/purchases.json?tab=${tab}`)

  React.useEffect(() => {
    resetList()
  }, [tab])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My Purchases</h1>
      </div>

      <Tabs defaultValue="music" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="products">Products / Merch</TabsTrigger>
        </TabsList>

        <TabsContent value="music">
          <ScrollArea className="h-[600px] rounded-md border p-4">
            <div className="space-y-4">
              {purchases.map((purchase, idx) => (
                <div key={purchase.id} ref={idx === purchases.length - 1 ? lastElementRef : null}>
                  <PurchaseItem purchase={purchase} />
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
        </TabsContent>

        <TabsContent value="tickets">
          <TicketPurchases 
            purchases={purchases}
            loading={loading}
            lastElementRef={lastElementRef}
          />
        </TabsContent>

        <TabsContent value="products">
          <ScrollArea className="h-[600px] rounded-md border p-4">
            <div className="space-y-4">
              {purchases.map((purchase, idx) => (
                <div key={purchase.id} ref={idx === purchases.length - 1 ? lastElementRef : null}>
                  <PurchaseItem purchase={purchase} />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
