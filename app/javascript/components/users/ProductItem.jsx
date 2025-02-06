import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { post } from '@rails/request.js'


export default function ProductItem({ product, elementRef }) {
  const coverImage = product.product_images[0]?.image_url
  const { toast } = useToast()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    try {
      const response = await post(`/${product.user.username}/product_cart/add/${product.id}`)
      if (response.ok) {
        toast({
          title: "Added to cart",
          description: `${product.title} has been added to your cart.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add to cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-h-1 aspect-w-1 w-full relative">
        <motion.div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center gap-2"
        >
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Link
            to={`/${product.user.username}/products/${product.slug}`}
            className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-white text-gray-900 hover:bg-gray-100"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </motion.div>
        <img
          src={coverImage}
          alt={product.title}
          className="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Link 
              to={`/${product.user.username}/products/${product.slug}`}
              className="block"
            >
              <h3 className="font-semibold text-base line-clamp-1 hover:text-primary transition-colors">
                {product.title}
              </h3>
            </Link>
            <Badge variant="secondary" className="mt-1">
              {product.category}
            </Badge>
          </div>
          <p className="text-lg font-bold text-primary ml-2">
            ${product.price}
          </p>
        </div>
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <p className="text-xs text-orange-500 mt-1">
            Only {product.stock_quantity} left in stock
          </p>
        )}
        {product.stock_quantity === 0 && (
          <p className="text-xs text-destructive mt-1">
            Out of stock
          </p>
        )}
      </div>
    </motion.div>
  )
}
