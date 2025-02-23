import React from "react"
import { motion } from "framer-motion"
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { useNavigate, useLocation } from "react-router-dom"


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
            <p className="text-2xl font-bold">${product.price}</p>
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
  
  const { 
    items: products, 
    loading, 
    lastElementRef 
  } = useInfiniteScroll(currentCategory.path + ".json")

  const handleTabChange = (value) => {
    const category = CATEGORIES.find(cat => cat.id === value)
    navigate(category.path)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        className="text-4xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Store
      </motion.h1>

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
