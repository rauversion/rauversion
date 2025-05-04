import React, { useEffect } from 'react'
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
import { Link } from 'react-router-dom'
import useCartStore from '@/stores/cartStore'
import { useToast } from "@/hooks/use-toast"
import I18n from '@/stores/locales'

export function CartIndicator() {
  const { cart, loading, error, fetchCart, clearError } = useCartStore()
  const { toast } = useToast()

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

  if (loading || !cart) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cart.total_items > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
              {cart.total_items}
            </span>
          )}
          <span className="sr-only">{I18n.t('products.cart.sr_label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{I18n.t('products.cart.title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cart && cart.items.length === 0 ? (
          <div className="px-2 py-4 text-center text-muted-foreground">
            {I18n.t('products.cart.empty')}
          </div>
        ) : (
          <>
            {cart && cart.items.map((item) => (
              <DropdownMenuItem key={item.id} className="flex items-center gap-3 px-4 py-2">
                {item.product.cover_url?.small && (
                  <img
                    src={item.product.cover_url.small}
                    alt={item.product.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.product.quantity} × {item.product.price}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => useCartStore.getState().removeFromCart(item.product.id)}
                >
                  {I18n.t('products.cart.remove')}
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="p-4">
              <div className="flex justify-between text-sm mb-4">
                <span>{I18n.t('products.cart.total')}</span>
                <span className="font-medium">{cart.total_price}</span>
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
