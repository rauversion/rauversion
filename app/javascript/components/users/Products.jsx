import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import useAuthStore from '../../stores/authStore'
import I18n from '@/stores/locales'
import ProductItem from './ProductItem'

export default function UserProducts() {
  const { username } = useParams()
  const currentUser = useAuthStore((state) => state.currentUser)
  
  const {
    items: products,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/products.json`)

  const canManageProducts = currentUser?.username === username && currentUser?.can_sell_products

  return (
    <div className="bg-default">
      <div className="mx-auto max-w-5xl px-0 pt-1 sm:px-4 sm:pt-2">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-default">
              {I18n.t('products.index.products')}
            </h2>
          </div>

          {canManageProducts && (
            <Button asChild size="sm" className="h-10 rounded-lg px-4 shadow-sm">
              <Link to={`/${username}/products/new`}>
                <Plus className="h-4 w-4" />
                {I18n.t('products.index.add_new_product')}
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {products.map((product, index) => (
            <ProductItem
              key={product.id}
              product={product}
              elementRef={products.length === index + 1 ? lastElementRef : null}
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
