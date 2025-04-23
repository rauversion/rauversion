import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Truck,
  Tag,
  Shirt,
  Coffee,
  Sticker,
  Package
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import useCartStore from '@/stores/cartStore'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../shared/constants'
import PhotosSection from "../shared/PhotosSection"
import PublicPhotosSection from "../shared/public/PublicPhotosSection"

export default function MerchShow({ product }) {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { addToCart } = useCartStore()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/${product.user.username}/products`)}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {I18n.t('back')}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={product.user.avatar_url} />
                  <AvatarFallback>{product.user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{product.user.name}</span>
              </div>
              <Badge variant="outline" className="flex items-center space-x-1">
                {CATEGORY_ICONS[product.category]}
                <span>{CATEGORY_LABELS[product.category]}</span>
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${product.price}
            </div>
            <Badge
              variant={product.stock_quantity > 0 ? "default" : "destructive"}
              className="mt-1"
            >
              {product.stock_quantity > 0 ?
                `${product.stock_quantity} in stock` :
                'Sold out'
              }
            </Badge>
          </div>
        </div>
      </div>

      <PublicPhotosSection product={product} />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.merch.show.about')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.merch.show.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {I18n.t('products.merch.show.shipping')}
                </h4>
                {product.shipping_options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between text-sm">
                    <span>{option.region}</span>
                    <div className="text-right">
                      <div>${option.price}</div>
                      <div className="text-muted-foreground text-xs">
                        {option.estimated_days} {I18n.t('products.merch.show.business_days')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {product.stock_quantity > 0 && (
                <Button onClick={() => addToCart(product.id)} className="w-full" size="lg">
                  ${product.price} {I18n.t('products.merch.show.add_to_cart')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
