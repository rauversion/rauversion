import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import ProductItem from './ProductItem'

export default function UserProducts() {
  const { username } = useParams()
  
  const {
    items: products,
    loading,
    lastElementRef
  } = useInfiniteScroll(`/${username}/products.json`)

  return (
    <div className="bg-default">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        
        <Link to={`/${username}/products/new`} className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-brand-600 text-white hover:bg-brand-700">  
          Add product
        </Link>
        <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
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
            <p className="text-gray-400">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
