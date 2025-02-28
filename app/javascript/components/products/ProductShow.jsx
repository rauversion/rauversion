import React, { useState, useEffect } from 'react'
import ServiceShow from './service/Show'
import MusicShow from './music/Show'
import GearShow from './gear/Show'
import MerchShow from './merch/Show'
import AccessoryShow from './accessory/Show'
import useCartStore from '@/stores/cartStore'
import useAuthStore from '@/stores/authStore'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { get } from '@rails/request.js'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import I18n from '@/stores/locales'

export default function ProductShow() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { username, slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const { addToCart } = useCartStore()
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await get(`/${username}/products/${slug}.json`)
        if (response.ok) {
          const data = await response.json
          setProduct(data.product)
          if (data.photos?.length > 0) {
            setSelectedImage(data.photos[0])
          }
          
          // Check if current user is the owner of the product
          if (currentUser && data.product.user && data.product.user.id === currentUser.id) {
            setIsOwner(true)
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

  const handleEdit = () => {
    navigate(`/${username}/products/${slug}/edit`)
  }

  return (
    <div>
      {isOwner && (
        <div className="flex justify-end mb-4 px-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            {I18n.t('products.show.edit_product')}
          </Button>
        </div>
      )}
      <ProductComponent product={product} />
    </div>
  )
}
