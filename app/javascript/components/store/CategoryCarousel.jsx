import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

const CategoryCarousel = ({ title, products, loading }) => {
  const containerRef = React.useRef(null)
  const navigate = useNavigate()

  const scroll = (direction) => {
    if (containerRef.current) {
      const { current } = containerRef
      const scrollAmount = direction === 'left' ? -400 : 400
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (loading || !products?.length) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide gap-4 pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="flex-none w-[300px]"
            style={{ scrollSnapAlign: 'start' }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(product.path)}
          >
            <Card className="h-full cursor-pointer overflow-hidden">
              {product.cover_url?.medium && (
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.cover_url.medium} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-medium text-lg line-clamp-1">{product.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                <p className="text-lg font-bold mt-2">${product.price}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default CategoryCarousel
