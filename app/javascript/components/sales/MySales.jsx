import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistance } from "date-fns"
import {useInfiniteScroll} from "@/hooks/useInfiniteScroll"
import { Loader2 } from "lucide-react"

function SaleItem({ sale }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        {sale.type === "Product" ? (
          <Avatar>
            <AvatarImage src={sale.buyer?.avatar_url} />
            <AvatarFallback>{sale.buyer?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        ) : (
          <Avatar>
            <AvatarImage src={sale.purchased_item?.cover_url} className="object-cover" />
            <AvatarFallback>{sale.purchased_item?.title?.charAt(0) || "T"}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">
            {sale.type === "Product" ? (
              <div>
                {sale.items.map((item) => (
                  <div key={item.id}>
                    {item.quantity}x {item.product.title} - ${item.price}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {sale.purchased_item.title} - ${sale.purchase.price}
              </div>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {sale.type === "Product" ? (
              <>Buyer: {sale.buyer.name} ({sale.buyer.email})</>
            ) : (
              <>Buyer: {sale.purchase.user.name} ({sale.purchase.user.email})</>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistance(new Date(sale.created_at), new Date(), { addSuffix: true })}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={
          sale.type === "Product" 
            ? sale.status === "completed" ? "success" : "secondary"
            : sale.purchase.state === "completed" ? "success" : "secondary"
        }>
          {sale.type === "Product" ? sale.status : sale.purchase.state}
        </Badge>
        {sale.type === "Product" && sale.shipping_status && (
          <Badge variant="outline">{sale.shipping_status}</Badge>
        )}
      </div>
    </div>
  )
}

export default function MySales() {
  const [tab, setTab] = React.useState("Album")
  const {
    items: sales,
    loading,
    lastElementRef,
    resetList,
    page,
    fetchItems,
  } = useInfiniteScroll(`/sales.json?tab=${tab}`)

  React.useEffect(() => {
    resetList()
  }, [tab])

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Sales</h1>
        <p className="text-muted-foreground">
          Manage your sales and track your earnings
        </p>
      </div>

      <Tabs defaultValue="Album" className="w-full" onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Album">Albums</TabsTrigger>
          <TabsTrigger value="Track">Tracks</TabsTrigger>
          <TabsTrigger value="Product">Products & Merch</TabsTrigger>
        </TabsList>

        <TabsContent value="Album" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {sales.map((sale, index) => (
                    <React.Fragment key={sale.id}>
                      <SaleItem sale={sale} />
                      {index === sales.length - 1 ? (
                        <div ref={lastElementRef} />
                      ) : null}
                    </React.Fragment>
                  ))}
                  {loading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Track" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {sales.map((sale, index) => (
                    <React.Fragment key={sale.id}>
                      <SaleItem sale={sale} />
                      {index === sales.length - 1 ? (
                        <div ref={lastElementRef} />
                      ) : null}
                    </React.Fragment>
                  ))}
                  {loading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Product" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {sales.map((sale, index) => (
                    <React.Fragment key={sale.id}>
                      <SaleItem sale={sale} />
                      {index === sales.length - 1 ? (
                        <div ref={lastElementRef} />
                      ) : null}
                    </React.Fragment>
                  ))}
                  {loading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
