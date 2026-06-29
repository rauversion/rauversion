import React, { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useCartStore from '@/stores/cartStore'
import { useToast } from "@/hooks/use-toast"
import I18n from '@/stores/locales'

const itemQuantity = (item) => {
  const quantity = Number(item?.quantity ?? item?.product?.quantity ?? 1)
  return Number.isFinite(quantity) ? quantity : 0
}

const itemImageSrc = (item) => {
  const product = item?.product
  return (
    product?.cover_url?.small ||
    product?.images?.[0]?.small ||
    product?.images?.[0]?.medium ||
    product?.product_images?.[0]?.image_url ||
    product?.product_images?.[0]?.url ||
    null
  )
}

export function CartIndicator() {
  const { cart, loading, error, fetchCart, clearError, openOnAdd, clearOpenOnAdd } = useCartStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const items = Array.isArray(cart?.items) ? cart.items : []
  const itemCount = items.reduce((total, item) => total + itemQuantity(item), 0)

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: I18n.t('products.cart.error'),
        description: error
      })
      clearError()
    }
  }, [error, toast, clearError])

  // Open cart when a product is added
  useEffect(() => {
    if (!openOnAdd) return

    let isOpenHandled = false
    let openTimer
    let openFrame

    const stopWaitingToOpen = () => {
      window.removeEventListener('scroll', openWhenTopIsReached)
      window.removeEventListener('scrollend', openCart)
      window.clearTimeout(openTimer)

      if (openFrame) {
        window.cancelAnimationFrame(openFrame)
      }
    }

    const openCart = () => {
      if (isOpenHandled) return

      isOpenHandled = true
      setOpen(true)
      clearOpenOnAdd()
      stopWaitingToOpen()
    }

    const openWhenTopIsReached = () => {
      if (window.scrollY <= 2) openCart()
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    window.addEventListener('scroll', openWhenTopIsReached)
    window.addEventListener('scrollend', openCart, { once: true })

    if (window.scrollY <= 2) {
      openFrame = window.requestAnimationFrame(openCart)
    }

    openTimer = window.setTimeout(openCart, 800)

    return stopWaitingToOpen
  }, [openOnAdd, clearOpenOnAdd])

  if (!cart) return null
  if (itemCount === 0 && !loading && !open) return null

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" disabled={loading && itemCount === 0}>
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
              {itemCount}
            </span>
          )}
          <span className="sr-only">{I18n.t('products.cart.sr_label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{I18n.t('products.cart.title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-4 text-center text-muted-foreground">
            {I18n.t('products.cart.empty')}
          </div>
        ) : (
          <>
            {items.map((item, index) => {
              const imageSrc = itemImageSrc(item)

              return (
                <DropdownMenuItem key={item.id ?? item.product?.id ?? index} className="flex items-center gap-3 px-4 py-2">
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={item.product?.title || I18n.t('products.cart.title')}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product?.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {itemQuantity(item)} × {item.product?.formatted_price || item.product?.price}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={!item.product?.id}
                    onClick={() => useCartStore.getState().removeFromCart(item.product.id)}
                  >
                    {I18n.t('products.cart.remove')}
                  </Button>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <div className="p-4">
              <div className="flex justify-between text-sm mb-4">
                <span>{I18n.t('products.cart.total')}</span>
                <span className="font-medium">{cart?.total_price}</span>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => useCartStore.getState().checkout()}
                  disabled={loading}
                >
                  {loading ? I18n.t('products.cart.processing') : I18n.t('products.cart.checkout')}
                </Button>
                {/*<Link 
                  to="/cart"
                  className="block w-full text-center text-muted-foreground hover:text-foreground text-sm"
                >
                  {I18n.t('products.cart.view_details')}
                </Link>*/}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
