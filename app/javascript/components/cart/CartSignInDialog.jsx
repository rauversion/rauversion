import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import useCartStore from '@/stores/cartStore'
import I18n from '@/stores/locales'

export default function CartSignInDialog() {
  const navigate = useNavigate()
  const signInRequired = useCartStore((state) => state.signInRequired)
  const dismissSignIn = useCartStore((state) => state.dismissSignIn)

  const handleSignIn = () => {
    dismissSignIn()
    navigate('/users/sign_in')
  }

  return (
    <Dialog open={signInRequired} onOpenChange={(open) => { if (!open) dismissSignIn() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{I18n.t('products.cart.sign_in_title')}</DialogTitle>
          <DialogDescription>{I18n.t('products.cart.sign_in_required')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={dismissSignIn}>
            {I18n.t('cancel')}
          </Button>
          <Button type="button" onClick={handleSignIn}>
            {I18n.t('sessions.sign_in')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
