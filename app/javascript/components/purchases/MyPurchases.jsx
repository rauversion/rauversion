import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, CheckCircle } from "lucide-react";
import { formatDistance } from "date-fns";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import TicketPurchases from "./TicketPurchases";
import { useToast } from "@/hooks/use-toast";
import { useActionCable } from "@/hooks/useActionCable";
import useAuthStore from "@/stores/authStore";
import { get } from "@rails/request.js";
import { Link } from "react-router";

function PurchaseItem({ purchase, toast, downloadUrl }) {
  const [downloadStatus, setDownloadStatus] = useState(
    downloadUrl ? "ready" : "idle"
  ); // idle, loading, processing, ready

  const handleDownload = async () => {
    setDownloadStatus("loading");

    try {
      const response = await get(purchase.download_path, {
        responseKind: "json",
      });

      if (response.ok) {
        const data = await response.json;

        if (data.status === "ready") {
          setDownloadStatus("ready");
          // Redirect to download URL
          window.location.href = data.download_url;

          // Reset status after download starts
          setTimeout(() => {
            setDownloadStatus("idle");
          }, 3000);
        } else if (data.status === "processing") {
          setDownloadStatus("processing");
          toast({
            title: "Download Processing",
            description: data.message,
            duration: 5000,
          });
        }
      } else {
        setDownloadStatus("idle");
        toast({
          title: "Download Error",
          description: "There was an error processing your download request.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      setDownloadStatus("idle");
      toast({
        title: "Download Error",
        description: "There was an error processing your download request.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        {purchase.purchased_items &&
          purchase.purchased_items.map((item) => (
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
                {/* Course info if present */}
                {item.purchased_item.course && (
                  <div className="mt-1">
                    <Link
                      to={`/courses/${item.purchased_item.course.slug}`}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      {item.purchased_item.course.title}
                    </Link>
                    {item.purchased_item.course.description && (
                      <p className="text-xs text-muted-foreground">
                        {item.purchased_item.course.description}
                      </p>
                    )}
                    {item.purchased_item.course.price && (
                      <p className="text-xs text-muted-foreground">
                        Price: ${item.purchased_item.course.price}
                      </p>
                    )}
                  </div>
                )}
                <p className="hidden text-sm text-muted-foreground">
                  Type: {item.purchased_item.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(new Date(purchase.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {/* Course info rendered above */}

              {item.service_booking && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <span className="capitalize">{item.service_booking.status}</span>
                  </Badge>
                  <Link
                    to={`/service_bookings/${item.service_booking.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View Booking
                  </Link>
                </div>
              )}
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
          <Badge
            variant={purchase.status === "completed" ? "success" : "secondary"}
          >
            {purchase.status}
          </Badge>
        )}
        {purchase.price && <Badge variant="outline">${purchase.price}</Badge>}
        {purchase.total_amount && (
          <Badge variant="outline">${purchase.total_amount}</Badge>
        )}
        {purchase.download_path &&
          (downloadUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={downloadUrl} download>
                <CheckCircle className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={
                downloadStatus === "loading" || downloadStatus === "processing"
              }
            >
              {downloadStatus === "loading" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {downloadStatus === "processing" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {downloadStatus === "ready" && (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {downloadStatus === "idle" && (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadStatus === "loading" && "Loading..."}
              {downloadStatus === "processing" && "Processing..."}
              {downloadStatus === "ready" && "Downloaded"}
              {downloadStatus === "idle" && "Download"}
            </Button>
          ))}
      </div>
    </div>
  );
}

export default function MyPurchases() {
  const [tab, setTab] = React.useState("music");
  const { toast } = useToast();
  const [downloadUrls, setDownloadUrls] = useState({});
  const {
    items: purchases,
    loading,
    lastElementRef,
    resetList,
    page,
    fetchItems,
  } = useInfiniteScroll(`/purchases.json?tab=${tab}`);

  const { currentUser } = useAuthStore();
  const { subscribe, unsubscribe } = useActionCable();

  React.useEffect(() => {
    resetList();
  }, [tab]);

  useEffect(() => {
    // Subscribe to purchase channel
    const channel = subscribe(
      "PurchaseChannel",
      {},
      {
        received: (data) => {
          if (data.action === "processing_download") {
            // Find the purchase in the list
            const purchaseIndex = purchases.findIndex(
              (p) => p.id === data.purchase_id
            );
            if (purchaseIndex !== -1) {
              // Update UI or show notification
              toast({
                title: "Download Status",
                description:
                  "Your download is being processed. You'll be notified when it's ready.",
                duration: 5000,
              });
            }
          } else if (data.action === "download_ready") {
            // Find the purchase in the list
            const purchaseIndex = purchases.findIndex(
              (p) => p.id === data.purchase_id
            );
            if (purchaseIndex !== -1) {
              // Update the download URL for this purchase
              setDownloadUrls((prev) => ({
                ...prev,
                [data.purchase_id]: data.download_url,
              }));

              // Show notification
              toast({
                title: "Download Ready",
                description: "Your download is ready!",
                duration: 5000,
              });
            }
          }
        },
      }
    );

    return () => {
      unsubscribe("PurchaseChannel");
    };
  }, [purchases]);

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
                <div
                  key={purchase.id}
                  ref={idx === purchases.length - 1 ? lastElementRef : null}
                >
                  <PurchaseItem
                    purchase={purchase}
                    toast={toast}
                    downloadUrl={downloadUrls[purchase.id]}
                  />
                  {idx < purchases.length - 1 && (
                    <hr className="my-4 border-t" />
                  )}
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
                <div
                  key={purchase.id}
                  ref={idx === purchases.length - 1 ? lastElementRef : null}
                >
                  <PurchaseItem
                    purchase={purchase}
                    toast={toast}
                    downloadUrl={downloadUrls[purchase.id]}
                  />
                  {idx < purchases.length - 1 && (
                    <hr className="my-4 border-t" />
                  )}
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
  );
}
