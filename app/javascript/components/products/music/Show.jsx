import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Disc, Clock, Music, Truck, Download, Star } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import useCartStore from '@/stores/cartStore'

import {FORMAT_ICONS, FORMAT_LABELS, CONDITIONS} from '../shared/constants'


export default function MusicShow({ product }) {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { addToCart } = useCartStore()

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
                {FORMAT_ICONS[product.category]}
                <span>{FORMAT_LABELS[product.category]}</span>
              </Badge>
              {product.include_digital_album && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Download className="h-4 w-4" />
                  <span>{I18n.t('products.music.includes_digital')}</span>
                </Badge>
              )}
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
          {product.album && (
            <Card>
              <CardHeader>
                <CardTitle>{product.album.title}</CardTitle>
                {product.album.description && (
                  <CardDescription>{product.album.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-24 text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.album.tracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell>{track.position}</TableCell>
                        <TableCell>{track.title}</TableCell>
                        <TableCell className="text-right">
                          {formatDuration(track.duration)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.music.show.about')}</CardTitle>
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
              <CardTitle>{I18n.t('products.music.show.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{I18n.t('products.music.show.condition')}</span>
                <span>{CONDITIONS[product.condition]}</span>
              </div>

              {product.limited_edition && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>{I18n.t('products.music.show.limited_edition')}</span>
                  </div>
                  <span>{product.limited_edition_count} copies</span>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {I18n.t('products.music.show.shipping')}
                </h4>
                {product.shipping_options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between text-sm">
                    <span>{option.region}</span>
                    <div className="text-right">
                      <div>${option.price}</div>
                      <div className="text-muted-foreground text-xs">
                        {option.estimated_days} {I18n.t('products.music.show.business_days')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {product.stock_quantity > 0 && (
                <Button onClick={()=> addToCart(product.id)} className="w-full" size="lg">
                  {I18n.t('products.music.show.add_to_cart')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
