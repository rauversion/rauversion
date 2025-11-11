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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-lg line-clamp-1 flex-1">{product.title}</h3>
                  <p className="text-lg font-bold ml-3 whitespace-nowrap">${product.price}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                
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
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-medium">P</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium group-hover/user:text-primary transition-colors">
                      {product.user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Creator
                    </span>
                  </div>
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default CategoryCarousel
