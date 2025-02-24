import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll"
import { get } from "@rails/request.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { useNavigate, useLocation } from "react-router-dom"
import CategoryCarousel from "./CategoryCarousel"
import CategoryGrid from "./CategoryGrid"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const CATEGORIES = [
  { id: 'all', name: 'All Products', path: '/store' },
  { id: 'gear', name: 'Gear', path: '/store/gear' },
  { id: 'service', name: 'Services', path: '/store/services' },
  { id: 'music', name: 'Music', path: '/store/music' },
  { id: 'accessory', name: 'Accessories', path: '/store/accessories' }
]

const ProductCard = ({ product }) => {
  const navigate = useNavigate()

  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden">
        <div className="relative h-[300px] overflow-hidden">
          {product.cover_url?.medium && (
            <img 
              src={product.cover_url.medium} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="line-clamp-1 flex-1">{product.title}</CardTitle>
            <p className="text-2xl font-bold ml-3 whitespace-nowrap">${product.price}</p>
          </div>
          <CardDescription className="line-clamp-2">{product.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/${product.user.username}`);
              }}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity group/user"
            >
              <div className="relative">
                <img 
                  src={product.user.avatar_url.small} 
                  alt={product.user.username}
                  className="w-10 h-10 rounded-full border-2 border-gray-200"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-medium">P</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium group-hover/user:text-primary transition-colors">
                  {product.user.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  Product Creator
                </span>
              </div>
            </button>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => navigate(product.path)}
          >
            View Details
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

const StoreIndex = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentCategory = CATEGORIES.find(cat => cat.path === location.pathname) || CATEGORIES[0]
  
  const [categoryProducts, setCategoryProducts] = useState({})
  const [loadingCategories, setLoadingCategories] = useState(true)

  const { 
    items: products, 
    loading, 
    lastElementRef 
  } = useInfiniteScroll(currentCategory.path + ".json")

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoadingCategories(true)
      try {
        const responses = await Promise.all(
          CATEGORIES.slice(1).map(category => 
            get(category.path + ".json", { query: { per_page: 10 } })
          )
        )
        
        const results = await Promise.all(
          responses.map(response => response.json)
        )
        
        const categoryData = CATEGORIES.slice(1).reduce((acc, category, index) => ({
          ...acc,
          [category.id]: results[index].collection
        }), {})
        
        setCategoryProducts(categoryData)
      } catch (error) {
        console.error("Error fetching category products:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategoryProducts()
  }, [])

  const handleTabChange = (value) => {
    const category = CATEGORIES.find(cat => cat.id === value)
    navigate(category.path)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryGrid />

      <div className="mb-16 mt-20">
        {CATEGORIES.slice(1).map(category => (
          <CategoryCarousel
            key={category.id}
            title={category.name}
            products={categoryProducts[category.id]}
            loading={loadingCategories}
          />
        ))}
      </div>

      <Tabs 
        value={currentCategory.id} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full justify-center mb-8">
          {CATEGORIES.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="text-lg px-6"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="h-[calc(100vh-300px)] overflow-y-auto p-4">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {loading && products.length === 0 ? (
              Array(8).fill().map((_, i) => (
                <LoadingSkeleton key={i} />
              ))
            ) : (
              products.map((product, index) => (
                <div key={product.id} ref={index === products.length - 1 ? lastElementRef : null}>
                  <ProductCard product={product} />
                </div>
              ))
            )}
          </motion.div>

          {!loading && products.length === 0 && (
            <p className="text-center text-gray-500 mt-8">
              No products found in this category
            </p>
          )}
        </div>
      </Tabs>
    </div>
  )
}

export default StoreIndex
