import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, Users, Globe, MapPin, Shuffle } from 'lucide-react'
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

const DELIVERY_METHOD_ICONS = {
  online: <Globe className="h-4 w-4" />,
  in_person: <MapPin className="h-4 w-4" />,
  hybrid: <Shuffle className="h-4 w-4" />
}

const DELIVERY_METHOD_LABELS = {
  online: I18n.t('products.service.delivery_methods.online'),
  in_person: I18n.t('products.service.delivery_methods.in_person'),
  hybrid: I18n.t('products.service.delivery_methods.hybrid')
}

export default function ServiceShow({ product }) {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { addToCart } = useCartStore()

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return `${minutes} minutes`
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
  }

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
                {DELIVERY_METHOD_ICONS[product.delivery_method]}
                <span>{DELIVERY_METHOD_LABELS[product.delivery_method]}</span>
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
              {/*product.stock_quantity > 0 ? 
                `${product.stock_quantity} slots available` : 
                'Sold out'
              */}
            </Badge>
          </div>
        </div>
      </div>

      {product.photos.length > 0 && (
        <Carousel className="mb-8">
          <CarouselContent>
            {product.photos.map((photo) => (
              <CarouselItem key={photo.id}>
                <img
                  src={photo.url}
                  alt={product.title}
                  className="w-full h-[400px] object-cover rounded-lg"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.service.show.about')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.service.show.what_to_expect')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: product.what_to_expect }} 
              />
            </CardContent>
          </Card>

          {product.prerequisites && (
            <Card>
              <CardHeader>
                <CardTitle>{I18n.t('products.service.show.prerequisites')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ __html: product.prerequisites }} 
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.service.show.cancellation_policy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: product.cancellation_policy }} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.service.show.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{I18n.t('products.service.show.duration')}</span>
                </div>
                <span>{formatDuration(product.duration_minutes)}</span>
              </div>

              {product.category === 'classes' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{I18n.t('products.service.show.max_participants')}</span>
                  </div>
                  <span>{product.max_participants}</span>
                </div>
              )}

              <Separator />

              {product.stock_quantity > 0 && (
                <Button onClick={()=> addToCart(product.id)} className="w-full" size="lg">
                  {I18n.t('products.service.show.book_now')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
