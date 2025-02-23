import React, { useState, useEffect } from 'react'
import ServiceShow from './service/Show'
import MusicShow from './music/Show'
import GearShow from './gear/Show'
import MerchShow from './merch/Show'
import AccessoryShow from './accessory/Show'
import useCartStore from '@/stores/cartStore'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'

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
          setProduct(data.product)
          if (data.photos.length > 0) {
            setSelectedImage(data.photos[0])
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

  // Map product types to their respective components
  const PRODUCT_COMPONENTS = {
    'Products::ServiceProduct': ServiceShow,
    'Products::MusicProduct': MusicShow,
    'Products::GearProduct': GearShow,
    'Products::MerchProduct': MerchShow,
    'Products::AccessoryProduct': AccessoryShow
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  // Get the component based on product type
  const ProductComponent = PRODUCT_COMPONENTS[product.type]

  if (!ProductComponent) {
    console.error(`No component found for product type: ${product.type}`)
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-500">
          Unsupported product type
        </h2>
        <p className="mt-2 text-gray-600">
          Product type: {product.type}
        </p>
      </div>
    )
  }

  return <ProductComponent product={product} />
}
