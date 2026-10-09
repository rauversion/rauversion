import React, { useMemo, useState } from "react"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll"
import { useParams, useSearchParams } from "react-router-dom"
import { Button } from "../ui/button"
import ProductCard, { ProductCardSkeleton } from "./ProductCard"
import { ScrollArea } from "../ui/scroll-area"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "../ui/drawer"
import { Menu } from "lucide-react"
import I18n from "@/stores/locales"

const CATEGORY_CONFIG = {
  gear: {
    titleKey: "store.filters.gear.title",
    subcategories: [
      { id: "all", labelKey: "store.filters.gear.subcategories.all" },
      { id: "audio_gear", labelKey: "store.filters.gear.subcategories.audio_gear" },
      { id: "dj_gear", labelKey: "store.filters.gear.subcategories.dj_gear" },
      { id: "instrument", labelKey: "store.filters.gear.subcategories.instrument" },
      { id: "synth", labelKey: "store.filters.gear.subcategories.synth" },
      { id: "keyboard", labelKey: "store.filters.gear.subcategories.keyboard" },
      { id: "controller", labelKey: "store.filters.gear.subcategories.controller" },
      { id: "console", labelKey: "store.filters.gear.subcategories.console" },
      { id: "effect", labelKey: "store.filters.gear.subcategories.effect" }
    ]
  },
  services: {
    titleKey: "store.filters.services.title",
    subcategories: [
      { id: "all", labelKey: "store.filters.services.subcategories.all" },
      { id: "feedback", labelKey: "products.service.categories.feedback" },
      { id: "classes", labelKey: "products.service.categories.classes" },
      { id: "one_on_one_class", labelKey: "products.service.categories.one_on_one_class" },
      { id: "workshop", labelKey: "products.service.categories.workshop" },
      { id: "mixing", labelKey: "products.service.categories.mixing" },
      { id: "mastering", labelKey: "products.service.categories.mastering" },
      { id: "production", labelKey: "products.service.categories.production" },
      { id: "coaching", labelKey: "products.service.categories.coaching" },
      { id: "event_consulting", labelKey: "products.service.categories.event_consulting" }
    ]
  },
  performers: {
    titleKey: "store.filters.performers.title",
    subcategories: [
      { id: "all", labelKey: "store.filters.performers.subcategories.all" },
      { id: "dj_set", labelKey: "products.service.categories.dj_set" },
      { id: "live_act", labelKey: "products.service.categories.live_act" },
      { id: "hybrid_live", labelKey: "products.service.categories.hybrid_live" },
      { id: "vocalist", labelKey: "products.service.categories.vocalist" },
      { id: "host_mc", labelKey: "products.service.categories.host_mc" }
    ]
  },
  music: {
    titleKey: "store.filters.music.title",
    subcategories: [
      { id: "all", labelKey: "store.filters.music.subcategories.all" },
      { id: "vinyl", labelKey: "products.music.formats.vinyl" },
      { id: "cassette", labelKey: "products.music.formats.cassette" },
      { id: "cd", labelKey: "products.music.formats.cd" },
      { id: "digital", labelKey: "products.music.formats.digital" },
      { id: "blue_ray", labelKey: "products.music.formats.blue_ray" },
      { id: "other", labelKey: "products.music.formats.other" }
    ]
  },
  accessories: {
    titleKey: "store.filters.accessories.title",
    subcategories: [
      { id: "all", labelKey: "store.filters.accessories.subcategories.all" },
      { id: "accessories", labelKey: "products.accessory.categories.accessories" },
      { id: "cables", labelKey: "products.accessory.categories.cables" },
      { id: "cases", labelKey: "products.accessory.categories.cases" },
      { id: "stands", labelKey: "products.accessory.categories.stands" },
      { id: "other", labelKey: "products.accessory.categories.other" }
    ]
  },
  merch: {
    titleKey: "store.filters.merch.title",
    subcategories: [
      { id: "all", labelKey: "store.filters.merch.subcategories.all" },
      { id: "merch", labelKey: "store.filters.merch.subcategories.merch" },
      { id: "t-shirts", labelKey: "products.merch.categories.t_shirts" },
      { id: "hoodies", labelKey: "products.merch.categories.hoodies" },
      { id: "mugs", labelKey: "products.merch.categories.mugs" },
      { id: "stickers", labelKey: "products.merch.categories.stickers" },
      { id: "other", labelKey: "products.merch.categories.other" }
    ]
  }
}

const CategoryMenuButton = ({ subcategory, selected, count, onClick }) => (
  <Button
    variant={selected ? "default" : "ghost"}
    className="w-full justify-between gap-3"
    onClick={onClick}
>
    <span className="truncate">{I18n.t(subcategory.labelKey)}</span>
    {count !== null && (
      <span
        className={`inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
          selected
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    )}
  </Button>
)

const CategoryView = () => {
  const { type } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const categoryConfig = CATEGORY_CONFIG[type]
  const requestedSubcategory = searchParams.get("subcategory") || "all"
  const selectedSubcategory = categoryConfig?.subcategories.some(
    (subcategory) => subcategory.id === requestedSubcategory
  )
    ? requestedSubcategory
    : "all"

  const selectSubcategory = (subcategoryId) => {
    const nextParams = new URLSearchParams(searchParams)

    if (subcategoryId === "all") {
      nextParams.delete("subcategory")
    } else {
      nextParams.set("subcategory", subcategoryId)
    }

    setSearchParams(nextParams)
  }

  const listingSearchParams = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (selectedSubcategory === "all") {
      nextParams.delete("subcategory")
    } else {
      nextParams.set("subcategory", selectedSubcategory)
    }

    return nextParams.toString()
  }, [searchParams, selectedSubcategory])

  const listingUrl = `/store/${type}.json${listingSearchParams ? `?${listingSearchParams}` : ""}`

  const {
    items: products,
    loading,
    data,
    lastElementRef
  } = useInfiniteScroll(listingUrl)

  if (!categoryConfig) return null

  const categoryCounts = data?.metadata?.category_counts
  const countFor = (subcategoryId) => (
    categoryCounts ? categoryCounts[subcategoryId] ?? 0 : null
  )

  return (
    <div className="@container/store-category container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 @4xl/store-category:flex-row">
        {/* Sidebar for desktop */}
        <div className="hidden w-64 flex-shrink-0 @4xl/store-category:block">
          <h2 className="mb-6 text-2xl font-bold">{I18n.t(categoryConfig.titleKey)}</h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="pr-4 space-y-1">
              {categoryConfig.subcategories.map(subcategory => (
                <CategoryMenuButton
                  key={subcategory.id}
                  subcategory={subcategory}
                  selected={selectedSubcategory === subcategory.id}
                  count={countFor(subcategory.id)}
                  onClick={() => selectSubcategory(subcategory.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile menu button */}
        <div className="flex w-full flex-col @4xl/store-category:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{I18n.t(categoryConfig.titleKey)}</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              aria-label={I18n.t("store.filters.open_menu")}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{I18n.t(categoryConfig.titleKey)}</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" className="absolute right-2 top-2" onClick={() => setDrawerOpen(false)}>
                    ×
                  </Button>
                </DrawerClose>
              </DrawerHeader>
              <div className="p-4">
                <div className="space-y-1">
                  {categoryConfig.subcategories.map(subcategory => (
                    <CategoryMenuButton
                      key={subcategory.id}
                      subcategory={subcategory}
                      selected={selectedSubcategory === subcategory.id}
                      count={countFor(subcategory.id)}
                      onClick={() => {
                        selectSubcategory(subcategory.id)
                        setDrawerOpen(false)
                      }}
                    />
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Main Content */}
        <div className="@container/store-category-content min-w-0 flex-1">
          <div className="grid min-h-[300px] grid-cols-2 gap-3 @xl/store-category-content:grid-cols-3 @4xl/store-category-content:grid-cols-4 @6xl/store-category-content:grid-cols-5">
            {loading && products.length === 0 ? (
              Array(6).fill().map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : products.length > 0 ? (
              products.map((product, index) => (
                <div key={product.id} ref={index === products.length - 1 ? lastElementRef : null}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              !loading && (
                <div className="col-span-full flex flex-col items-center justify-center min-h-[200px]">
                  <p className="text-center text-muted-foreground">
                    {I18n.t("store.filters.no_products")}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryView
