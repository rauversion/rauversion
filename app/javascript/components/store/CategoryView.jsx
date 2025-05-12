import React, { useState } from "react"
import { motion } from "framer-motion"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { ScrollArea } from "../ui/scroll-area"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "../ui/drawer"
import { Menu } from "lucide-react"

const CATEGORY_CONFIG = {
  gear: {
    title: "Gear",
    subcategories: [
      { id: "all", name: "All Gear" },
      { id: "audio", name: "Audio Equipment" },
      { id: "studio", name: "Studio Equipment" },
      { id: "dj", name: "DJ Equipment" },
      { id: "instruments", name: "Instruments" }
    ]
  },
  services: {
    title: "Services",
    subcategories: [
      { id: "all", name: "All Services" },
      { id: "mixing", name: "Mixing" },
      { id: "mastering", name: "Mastering" },
      { id: "production", name: "Production" },
      { id: "coaching", name: "Coaching" }
    ]
  },
  music: {
    title: "Music",
    subcategories: [
      { id: "all", name: "All Music" },
      { id: "tracks", name: "Tracks" },
      { id: "albums", name: "Albums" },
      { id: "samples", name: "Samples" },
      { id: "presets", name: "Presets" }
    ]
  },
  accessories: {
    title: "Accessories",
    subcategories: [
      { id: "all", name: "All Accessories" },
      { id: "cables", name: "Cables" },
      { id: "cases", name: "Cases" },
      { id: "stands", name: "Stands" },
      { id: "other", name: "Other" }
    ]
  },
  merch: {
    title: "Merch",
    subcategories: [
      { id: "all", name: "All Merch" },
      { id: "t-shirts", name: "T-Shirts" },
      { id: "hoodies", name: "Hoodies" },
      { id: "mugs", name: "Mugs" },
      { id: "stickers", name: "Stickers" },
      { id: "other", name: "Other" }
    ]
  }
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        {product.cover_url?.medium && (
          <div className="aspect-square overflow-hidden">
            <img
              src={product.cover_url.medium}
              alt={product.title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="line-clamp-1">{product.title}</CardTitle>
          <CardDescription className="line-clamp-2">{product.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{product.formatted_price}</p>
            <div className="flex items-center space-x-2">
              <img
                src={product.user.avatar_url.small}
                alt={product.user.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-gray-500">{product.user.username}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => navigate(product.path)}
          >
            {I18n.t("more")}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

const LoadingSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-[200px] w-full" />
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-10 w-[150px]" />
  </div>
)

const CategoryView = () => {
  const { type } = useParams()
  const [selectedSubcategory, setSelectedSubcategory] = useState("all")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const categoryConfig = CATEGORY_CONFIG[type]

  const {
    items: products,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/store/${type}.json${selectedSubcategory !== 'all' ? `?subcategory=${selectedSubcategory}` : ''}`)

  if (!categoryConfig) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 sm:flex-row ">
        {/* Sidebar for desktop */}
        <div className="w-64 flex-shrink-0 hidden md:block">
          <h2 className="text-2xl font-bold mb-6">{categoryConfig.title}</h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="pr-4 space-y-1">
              {categoryConfig.subcategories.map(subcategory => (
                <Button
                  key={subcategory.id}
                  variant={selectedSubcategory === subcategory.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedSubcategory(subcategory.id)}
                >
                  {subcategory.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex flex-col w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{categoryConfig.title}</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{categoryConfig.title}</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" className="absolute right-2 top-2" onClick={() => setDrawerOpen(false)}>
                    ×
                  </Button>
                </DrawerClose>
              </DrawerHeader>
              <div className="p-4">
                <div className="space-y-1">
                  {categoryConfig.subcategories.map(subcategory => (
                    <Button
                      key={subcategory.id}
                      variant={selectedSubcategory === subcategory.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSubcategory(subcategory.id)
                        setDrawerOpen(false)
                      }}
                    >
                      {subcategory.name}
                    </Button>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
            {loading && products.length === 0 ? (
              Array(6).fill().map((_, i) => (
                <LoadingSkeleton key={i} />
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
                  <p className="text-center text-gray-500">
                    No products found in this category
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
