import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Download, Loader2, Music, Package, Receipt, Ticket } from "lucide-react";
import { formatDistance } from "date-fns";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import TicketPurchases from "./TicketPurchases";
import { useToast } from "@/hooks/use-toast";
import { useActionCable } from "@/hooks/useActionCable";
import { get } from "@rails/request.js";
import { Link, useParams, useNavigate } from "react-router";
import I18n from "@/stores/locales";

const PURCHASE_TABS = [
  {
    value: "overview",
    labelKey: "tabs.overview",
    icon: Receipt,
    descriptionKey: "descriptions.overview",
  },
  {
    value: "tickets",
    labelKey: "tabs.tickets",
    icon: Ticket,
    descriptionKey: "descriptions.tickets",
  },
  {
    value: "music",
    labelKey: "tabs.music",
    icon: Music,
    descriptionKey: "descriptions.music",
  },
  {
    value: "products",
    labelKey: "tabs.products",
    icon: Package,
    descriptionKey: "descriptions.products",
  },
];

const FILTER_TABS = PURCHASE_TABS.filter((tab) => tab.value !== "overview");
const PURCHASE_TAB_VALUES = PURCHASE_TABS.map((tab) => tab.value);
const TAB_DETAILS = PURCHASE_TABS.reduce((details, tab) => {
  details[tab.value] = tab;
  return details;
}, {});

function t(key, options = {}) {
  return I18n.t(`purchases.${key}`, options);
}

function countLabel(key, count) {
  return t(`counts.${key}`, { count });
}

function getPurchasedItems(purchase) {
  return purchase?.purchased_items || [];
}

function getPrimaryPurchasedItem(purchase) {
  return getPurchasedItems(purchase)[0]?.purchased_item;
}

function getPurchaseCurrency(purchase) {
  return getPurchasedItems(purchase).find((item) => item.currency)?.currency;
}

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || amount === "") return null;

  const value = Number(amount);
  if (!Number.isFinite(value)) return null;

  const currencyCode = String(currency || "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(value);
  } catch (_error) {
    return `$${value.toLocaleString("en-US")}`;
  }
}

function formatPurchaseDate(date) {
  if (!date) return t("fallbacks.unknown_date");

  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

function getTicketGroups(purchase) {
  const groups = new Map();

  getPurchasedItems(purchase).forEach((item) => {
    const title = item.purchased_item?.title || t("fallbacks.ticket");
    const current = groups.get(title) || 0;
    groups.set(title, current + (item.quantity || 1));
  });

  return Array.from(groups.entries()).map(([title, count]) => ({ title, count }));
}

function getTicketPurchaseContext(purchase) {
  const items = getPurchasedItems(purchase);
  const primaryItem = getPrimaryPurchasedItem(purchase);
  const event = items.find((item) => item.purchased_item?.event)?.purchased_item?.event;
  const ticketCount = items.reduce((total, item) => total + (item.quantity || 1), 0);

  return {
    event,
    title: event?.title || primaryItem?.title || t("fallbacks.purchase", { id: purchase.id }),
    ticketCount,
    groups: getTicketGroups(purchase),
  };
}

function getPurchaseTitle(tab, purchase) {
  if (tab === "tickets") return getTicketPurchaseContext(purchase).title;

  const primaryItem = getPrimaryPurchasedItem(purchase);
  return primaryItem?.title || t("fallbacks.purchase", { id: purchase.id });
}

function getPurchaseSummary(tab, purchase) {
  const items = getPurchasedItems(purchase);

  if (tab === "tickets") {
    const context = getTicketPurchaseContext(purchase);
    const ticketSummary = context.groups
      .slice(0, 2)
      .map((group) => `${group.count} x ${group.title}`)
      .join(", ");
    const suffix = context.groups.length > 2 ? ` + ${context.groups.length - 2} more` : "";

    return ticketSummary
      ? t("summaries.ticket_purchase", {
        count: context.ticketCount,
        count_label: countLabel("ticket", context.ticketCount),
        tickets: `${ticketSummary}${suffix}`,
      })
      : countLabel("ticket", context.ticketCount);
  }

  if (tab === "products") {
    const totalQuantity = purchase.total_quantity || items.reduce((total, item) => total + (item.quantity || 1), 0);
    return countLabel("item", totalQuantity || items.length);
  }

  const primaryType = getPrimaryPurchasedItem(purchase)?.type;
  return items.length > 1 ? countLabel("music_item", items.length) : primaryType || t("fallbacks.music_purchase");
}

function getPurchaseAmount(tab, purchase) {
  if (tab === "products") {
    return formatMoney(purchase.total_with_shipping ?? purchase.total_amount);
  }

  const currency = getPurchaseCurrency(purchase);
  const itemTotal = getPurchasedItems(purchase).reduce((total, item) => {
    const price = Number(item.price);
    return Number.isFinite(price) ? total + price : total;
  }, 0);

  return formatMoney(purchase.price ?? (itemTotal > 0 ? itemTotal : null), currency);
}

function getPurchaseStatus(purchase) {
  return purchase.status || purchase.state;
}

function getStatusVariant(status) {
  return ["paid", "completed"].includes(status) ? "success" : "secondary";
}

function getPurchaseImage(purchase) {
  return getPrimaryPurchasedItem(purchase)?.cover_url;
}

function getPurchaseInitial(tab, purchase) {
  return getPurchaseTitle(tab, purchase)?.charAt(0) || "P";
}

function usePurchaseOverview() {
  const [overview, setOverview] = useState({
    loading: true,
    error: null,
    tabs: {},
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchOverview() {
      setOverview((current) => ({ ...current, loading: true, error: null }));

      try {
        const entries = await Promise.all(
          FILTER_TABS.map(async (tab) => {
            try {
              const response = await get(`/purchases.json?tab=${tab.value}&page=1`);

              if (!response.ok) {
                throw new Error(t("errors.overview_tab"));
              }

              const data = await response.json;
              return [tab.value, data];
            } catch (error) {
              return [
                tab.value,
                {
                  collection: [],
                  metadata: { total_count: 0 },
                  error,
                },
              ];
            }
          })
        );
        const allRequestsFailed = entries.every(([, data]) => data.error);

        if (!cancelled) {
          setOverview({
            loading: false,
            error: allRequestsFailed ? entries[0]?.[1]?.error : null,
            tabs: Object.fromEntries(entries),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setOverview({
            loading: false,
            error,
            tabs: {},
          });
        }
      }
    }

    fetchOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  return overview;
}

function OverviewAccessCard({ tab, data, onNavigate }) {
  const Icon = tab.icon;
  const totalCount = data?.metadata?.total_count || 0;
  const latestPurchase = data?.collection?.[0];

  return (
    <button
      type="button"
      onClick={() => onNavigate(tab.value)}
      className="group flex min-h-[132px] w-full flex-col justify-between rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold leading-tight">{t(tab.labelKey)}</h2>
            <p className="text-sm text-muted-foreground">
              {countLabel("purchase", totalCount)}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {latestPurchase ? getPurchaseTitle(tab.value, latestPurchase) : t(tab.descriptionKey)}
      </p>
    </button>
  );
}

function OverviewPurchaseRow({ entry, onNavigate }) {
  const { tab, purchase } = entry;
  const tabDetails = TAB_DETAILS[tab];
  const Icon = tabDetails.icon;
  const status = getPurchaseStatus(purchase);
  const amount = getPurchaseAmount(tab, purchase);

  return (
    <button
      type="button"
      onClick={() => onNavigate(tab)}
      className="flex w-full flex-col gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="h-11 w-11 shrink-0 rounded-md">
          <AvatarImage src={getPurchaseImage(purchase)} className="object-cover" />
          <AvatarFallback className="rounded-md">
            {getPurchaseInitial(tab, purchase)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 font-medium">
              <Icon className="h-3 w-3" />
              {t(tabDetails.labelKey)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatPurchaseDate(purchase.created_at)}
            </span>
          </div>
          <h3 className="mt-1 truncate font-medium">{getPurchaseTitle(tab, purchase)}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {getPurchaseSummary(tab, purchase)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {status && (
          <Badge variant={getStatusVariant(status)}>
            {status}
          </Badge>
        )}
        {amount && <Badge variant="outline">{amount}</Badge>}
      </div>
    </button>
  );
}

function PurchaseOverview({ overview, onNavigate }) {
  const latestPurchases = useMemo(() => {
    return FILTER_TABS.flatMap((tab) => {
      const collection = overview.tabs[tab.value]?.collection || [];
      return collection.map((purchase) => ({ tab: tab.value, purchase }));
    })
      .sort((a, b) => new Date(b.purchase.created_at) - new Date(a.purchase.created_at))
      .slice(0, 8);
  }, [overview.tabs]);

  if (overview.loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (overview.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {t("errors.overview")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {FILTER_TABS.map((tab) => (
          <OverviewAccessCard
            key={tab.value}
            tab={tab}
            data={overview.tabs[tab.value]}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t("overview.latest_title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("overview.latest_description")}
          </p>
        </div>

        {latestPurchases.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <div className="divide-y">
              {latestPurchases.map((entry) => (
                <OverviewPurchaseRow
                  key={`${entry.tab}-${entry.purchase.id}`}
                  entry={entry}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ) : (
          <PurchaseEmptyState title={t("empty.overview.title")} description={t("empty.overview.description")} />
        )}
      </section>
    </div>
  );
}

function PurchaseTabHeader({ tab, totalCount }) {
  const tabDetails = TAB_DETAILS[tab];
  const Icon = tabDetails.icon;

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t(tabDetails.labelKey)}</h2>
          <p className="text-sm text-muted-foreground">{t(tabDetails.descriptionKey)}</p>
        </div>
      </div>

      {totalCount !== undefined && totalCount !== null && (
        <Badge variant="outline">
          {countLabel("purchase", totalCount)}
        </Badge>
      )}
    </div>
  );
}

function PurchaseEmptyState({ title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <Receipt className="mb-3 h-8 w-8 text-muted-foreground" />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

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
            title: t("download.processing_title"),
            description: data.message || t("download.processing_description"),
            duration: 5000,
          });
        }
      } else {
        setDownloadStatus("idle");
        toast({
          title: t("download.error_title"),
          description: t("download.error_description"),
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      setDownloadStatus("idle");
      toast({
        title: t("download.error_title"),
        description: t("download.error_description"),
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
                        {t("labels.price")}: ${item.purchased_item.course.price}
                      </p>
                    )}
                  </div>
                )}
                <p className="hidden text-sm text-muted-foreground">
                  {t("labels.type")}: {item.purchased_item.type}
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
                    {t("actions.view_booking")}
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
                {t("download.download")}
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
              {downloadStatus === "loading" && t("download.loading")}
              {downloadStatus === "processing" && t("download.processing")}
              {downloadStatus === "ready" && t("download.downloaded")}
              {downloadStatus === "idle" && t("download.download")}
            </Button>
          ))}
      </div>
    </div>
  );
}

export default function MyPurchases() {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState(
    PURCHASE_TAB_VALUES.includes(urlTab) ? urlTab : "overview"
  );
  const { toast } = useToast();
  const [downloadUrls, setDownloadUrls] = useState({});
  const overview = usePurchaseOverview();
  const activeListTab = tab === "overview" ? "music" : tab;
  const {
    items: purchases,
    loading,
    lastElementRef,
    data,
  } = useInfiniteScroll(`/purchases.json?tab=${activeListTab}`, {
    enabled: tab !== "overview",
  });

  const { subscribe, unsubscribe } = useActionCable();

  React.useEffect(() => {
    setTab(PURCHASE_TAB_VALUES.includes(urlTab) ? urlTab : "overview");
  }, [urlTab]);

  const handleTabChange = React.useCallback((newTab) => {
    setTab(newTab);
    navigate(newTab === "overview" ? "/purchases" : `/purchases/${newTab}`);
  }, [navigate]);

  useEffect(() => {
    // Subscribe to purchase channel
    subscribe(
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
                title: t("download.status_title"),
                description: t("download.status_description"),
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
                title: t("download.ready_title"),
                description: t("download.ready_description"),
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

  const totalCount = data?.metadata?.total_count;

  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t("page_title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("page_description")}
        </p>
      </div>

      <Tabs defaultValue="overview" value={tab} onValueChange={handleTabChange}>
        <TabsList className="h-auto flex-wrap">
          {PURCHASE_TABS.map((purchaseTab) => {
            const Icon = purchaseTab.icon;

            return (
              <TabsTrigger key={purchaseTab.value} value={purchaseTab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {t(purchaseTab.labelKey)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <PurchaseOverview overview={overview} onNavigate={handleTabChange} />
        </TabsContent>

        <TabsContent value="music" className="mt-6">
          <PurchaseTabHeader tab="music" totalCount={totalCount} />
          <ScrollArea className="h-[600px] rounded-md border p-4">
            {purchases.length > 0 || loading ? (
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
            ) : (
              <PurchaseEmptyState title={t("empty.music.title")} description={t("empty.music.description")} />
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <PurchaseTabHeader tab="tickets" totalCount={totalCount} />
          <TicketPurchases
            purchases={purchases}
            loading={loading}
            lastElementRef={lastElementRef}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <PurchaseTabHeader tab="products" totalCount={totalCount} />
          <ScrollArea className="h-[600px] rounded-md border p-4">
            {purchases.length > 0 || loading ? (
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
            ) : (
              <PurchaseEmptyState title={t("empty.products.title")} description={t("empty.products.description")} />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
