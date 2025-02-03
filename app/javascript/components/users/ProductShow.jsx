import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import useCartStore from '@/stores/cartStore'

export default function ProductShow() {
  const { username, slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const { addToCart } = useCartStore()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await get(`/${username}/products/${slug}.json`)
        if (response.ok) {
          const data = await response.json
          setProduct(data)
          if (data.product_images.length > 0) {
            setSelectedImage(data.product_images[0])
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [username, slug])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Product not found</p>
      </div>
    )
  }

  return (
    <div className="bg-default">
      <div className="mx-auto max-w-7xl">
        <nav className="flex px-4 pt-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/" className="text-sm text-muted hover:text-default">
                rauversion
              </Link>
            </li>
            <li>
              <span className="text-sm text-muted mx-2">/</span>
              <Link to={`/${username}`} className="text-sm text-muted hover:text-default">
                {username}
              </Link>
            </li>
            <li>
              <span className="text-sm text-muted mx-2">/</span>
              <span className="text-sm text-muted">
                {product.title}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-2 gap-8 p-8">
          {/* Left column - Image */}
          <div>
            <div className="aspect-square overflow-hidden rounded-lg">
              <img
                src={selectedImage?.image_url}
                alt={product.title}
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>

          
          {/* Right column - Product details */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-default">{product.title}</h1>
            
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-default">
                ${product.price}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-muted">
                <div>
                  <span className="font-semibold">SKU</span>
                  <p>{product.sku || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold">Category</span>
                  <p className="capitalize">{product.category}</p>
                </div>
                <div>
                  <span className="font-semibold">Status</span>
                  <p>Active</p>
                </div>
                <div>
                  <span className="font-semibold">Stock Quantity</span>
                  <p>{product.stock_quantity || 'N/A'}</p>
                </div>
                {product.album && (
                  <div className="col-span-2">
                    <span className="font-semibold">Associated Album</span>
                    <p>
                      <Link 
                        to={`/albums/${product.album.slug}`}
                        className="text-brand-600 hover:text-brand-500"
                      >
                        {product.album.title}
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="w-full rounded-md bg-brand-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 px-4 ">
          <h3 className="font-semibold text-default mb-2">Description</h3>
          <div 
            className="prose prose-sm text-default pb-4"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>

      </div>
    </div>
  )
}
