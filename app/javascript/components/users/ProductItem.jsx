import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { post } from '@rails/request.js'
import I18n from '@/stores/locales'

export default function ProductItem({ product, elementRef }) {
  const coverImage = product.product_images[0]?.image_url
  const { toast } = useToast()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    try {
      const response = await post(`/${product.user.username}/product_cart/add/${product.id}`)
      if (response.ok) {
        toast({
          title: I18n.t('products.added_to_cart'),
          description: I18n.t('products.added_to_cart_message', { title: product.title }),
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('products.add_to_cart_error'),
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
      className="group relative bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <Link
        to={`/${product.user.username}/products/${product.slug}`}
        className="block flex-1"
      >
        <div className="relative h-[300px] w-full overflow-hidden">
          <img
            src={coverImage}
            alt={product.title}
            className="h-full w-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <Link
              to={`/${product.user.username}/products/${product.slug}`}
              className="block flex-1"
            >
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
            </Link>
            <p className="text-xl font-bold text-primary ml-3 whitespace-nowrap">
              {product.price}
            </p>
          </div>

          <Badge variant="secondary" className="mb-3">
            {product.category}
          </Badge>

          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <p className="text-sm text-orange-500 font-medium">
              {I18n.t('products.stock.low_stock', { count: product.stock_quantity })}
            </p>
          )}
          {product.stock_quantity === 0 && (
            <p className="text-sm text-destructive font-medium">
              {I18n.t('products.stock.out_of_stock')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
