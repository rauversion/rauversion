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
import PublicPhotosSection from "../shared/public/PublicPhotosSection"
import BookingProposalModal from "./BookingProposalModal"

const DELIVERY_METHOD_ICONS = {
  online: <Globe className="h-4 w-4" />,
  in_person: <MapPin className="h-4 w-4" />,
  both: <Shuffle className="h-4 w-4" />,
  hybrid: <Shuffle className="h-4 w-4" />
}

const DELIVERY_METHOD_LABELS = {
  online: I18n.t('products.service.delivery_methods.online'),
  in_person: I18n.t('products.service.delivery_methods.in_person'),
  both: I18n.t('products.service.delivery_methods.hybrid'),
  hybrid: I18n.t('products.service.delivery_methods.hybrid')
}

const serviceKindLabel = (serviceKind) => {
  if (!serviceKind) return null

  return I18n.t(`products.service.service_kinds.${serviceKind}.label`)
}

const bookingModeLabel = (bookingMode) => {
  if (!bookingMode) return null

  return I18n.t(`products.service.booking_modes.${bookingMode}`)
}

const priceRuleTypeLabel = (ruleType) => {
  if (!ruleType) return null

  return I18n.t(`products.service.price_rule_types.${ruleType}`)
}

export default function ServiceShow({ product }) {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { addToCart } = useCartStore()
  const usesNegotiatedBooking = product.service_kind === "performance" ||
    product.booking_mode === "request_quote" ||
    product.booking_mode === "deposit_then_balance"

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return I18n.t("products.service.show.duration_minutes", { count: minutes })
    if (remainingMinutes === 0) return I18n.t("products.service.show.duration_hours", { count: hours })
    return I18n.t("products.service.show.duration_hours_minutes", {
      hours,
      minutes: remainingMinutes,
    })
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
              <Badge variant="secondary">
                {serviceKindLabel(product.service_kind)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {product.formatted_price}
            </div>
            {product.booking_mode && (
              <div className="text-sm text-muted-foreground">
                {bookingModeLabel(product.booking_mode)}
              </div>
            )}
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


      <PublicPhotosSection product={product} />

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

          {product.service_price_rules?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{I18n.t("products.service.show.price_rules.title")}</CardTitle>
                <CardDescription>
                  {I18n.t("products.service.show.price_rules.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.service_price_rules.map((rule) => (
                  <div key={rule.id || rule.name} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {[priceRuleTypeLabel(rule.rule_type), rule.location_scope, rule.duration_minutes ? I18n.t("products.service.show.duration_minutes", { count: rule.duration_minutes }) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <div className="text-right font-semibold">
                      {Number(rule.amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: (rule.currency || "usd").toUpperCase(),
                      })}
                    </div>
                  </div>
                ))}
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

              {usesNegotiatedBooking ? (
                <BookingProposalModal product={product} />
              ) : (
                <Button onClick={() => addToCart(product.id)} className="w-full" size="lg">
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
