import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { get } from '@rails/request.js'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { LoadingSpinner } from '@/components/shared'
import GearForm from './gear/Form'
import MusicForm from './music/Form'
import MerchForm from './merch/Form'
import AccessoryForm from './accessory/Form'
import ServiceForm from './service/Form'

export default function ProductEdit() {
  const { currentUser } = useAuthStore()
  const { username, slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await get(`/${username}/products/${slug}.json`)
        
        if (response.ok) {
          const data = await response.json
          // Map photos to product_images for form compatibility
          const productData = {
            ...data.product,
            product_images: data.product.photos
          }
          setProduct(productData)
        } else {
          setError('Failed to load product')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [username, slug])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            className="mt-2 text-blue-500 hover:underline"
            onClick={() => navigate(`/${username}/products`)}
          >
            {I18n.t('common.back_to_products')}
          </button>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  // Render the appropriate form based on product type
  const renderForm = () => {
    switch (product.type) {
      case 'Products::GearProduct':
        return <GearForm product={product} isEditing={true} />
      case 'Products::MusicProduct':
        return <MusicForm product={product} isEditing={true} />
      case 'Products::MerchProduct':
        return <MerchForm product={product} isEditing={true} />
      case 'Products::AccessoryProduct':
        return <AccessoryForm product={product} isEditing={true} />
      case 'Products::ServiceProduct':
        return <ServiceForm product={product} isEditing={true} />
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>{I18n.t('products.edit.unknown_type')}</p>
              <button 
                className="mt-2 text-blue-500 hover:underline"
                onClick={() => navigate(`/${username}/products`)}
              >
                {I18n.t('common.back_to_products')}
              </button>
            </div>
          </div>
        )
    }
  }

  return renderForm()
}
