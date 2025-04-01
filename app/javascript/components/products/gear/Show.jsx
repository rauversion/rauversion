import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  Truck, 
  Calendar, 
  Box, 
  Tag, 
  Repeat,
  Guitar,
  Headphones,
  Disc,
  Radio,
  Wrench
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import useCartStore from '@/stores/cartStore'
import PublicPhotosSection from "../shared/public/PublicPhotosSection"

const CATEGORY_ICONS = {
  instrument: <Guitar className="h-4 w-4" />,
  audio_gear: <Headphones className="h-4 w-4" />,
  dj_gear: <Disc className="h-4 w-4" />,
  synth: <Radio className="h-4 w-4" />,
  drum_kit: <Box className="h-4 w-4" />,
  keyboard: <Radio className="h-4 w-4" />,
  percussion: <Box className="h-4 w-4" />,
  bass: <Guitar className="h-4 w-4" />,
  guitar: <Guitar className="h-4 w-4" />,
  effect: <Wrench className="h-4 w-4" />,
  amp: <Radio className="h-4 w-4" />,
  console: <Radio className="h-4 w-4" />,
  controller: <Radio className="h-4 w-4" />
}

const CATEGORY_LABELS = {
  instrument: I18n.t('products.gear.categories.instrument'),
  audio_gear: I18n.t('products.gear.categories.audio_gear'),
  dj_gear: I18n.t('products.gear.categories.dj_gear'),
  synth: I18n.t('products.gear.categories.synth'),
  drum_kit: I18n.t('products.gear.categories.drum_kit'),
  keyboard: I18n.t('products.gear.categories.keyboard'),
  percussion: I18n.t('products.gear.categories.percussion'),
  bass: I18n.t('products.gear.categories.bass'),
  guitar: I18n.t('products.gear.categories.guitar'),
  effect: I18n.t('products.gear.categories.effect'),
  amp: I18n.t('products.gear.categories.amp'),
  console: I18n.t('products.gear.categories.console'),
  controller: I18n.t('products.gear.categories.controller')
}

const CONDITION_LABELS = {
  new: I18n.t('products.conditions.new'),
  like_new: I18n.t('products.conditions.like_new'),
  excellent: I18n.t('products.conditions.excellent'),
  very_good: I18n.t('products.conditions.very_good'),
  good: I18n.t('products.conditions.good'),
  fair: I18n.t('products.conditions.fair'),
  poor: I18n.t('products.conditions.poor')
}

export default function GearShow({ product }) {
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
              <CardTitle>{I18n.t('products.gear.show.about')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </CardContent>
          </Card>

          {product.accept_barter && (
            <Card>
              <CardHeader>
                <CardTitle>{I18n.t('products.gear.show.barter')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ __html: product.barter_description }} 
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{I18n.t('products.gear.show.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{I18n.t('products.gear.show.brand')}</span>
                </div>
                <span>{product.brand}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span>{I18n.t('products.gear.show.model')}</span>
                </div>
                <span>{product.model}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{I18n.t('products.gear.show.year')}</span>
                </div>
                <span>{product.year}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{I18n.t('products.gear.show.condition')}</span>
                <span>{CONDITION_LABELS[product.condition]}</span>
              </div>

              {product.accept_barter && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span>{I18n.t('products.gear.show.accepts_barter')}</span>
                  </div>
                  <Badge variant="secondary">
                    {I18n.t('products.gear.show.barter_available')}
                  </Badge>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {I18n.t('products.gear.show.shipping')}
                </h4>
                {product.shipping_options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between text-sm">
                    <span>{option.region}</span>
                    <div className="text-right">
                      <div>${option.price}</div>
                      <div className="text-muted-foreground text-xs">
                        {option.estimated_days} {I18n.t('products.gear.show.business_days')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {product.stock_quantity > 0 && (
                <Button onClick={()=> addToCart(product.id)} className="w-full" size="lg">
                  {I18n.t('products.gear.show.add_to_cart')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
