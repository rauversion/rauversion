import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { post } from '@rails/request.js'
import I18n from 'stores/locales'

export default function MusicPurchaseForm({ 
  open, 
  onOpenChange, 
  resource,
  type,
  onSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      price: resource.price || '',
      optional_message: ''
    }
  })
  const { toast } = useToast()

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const endpoint = type === 'Track' 
        ? `/tracks/${resource.slug}/track_purchases`
        : `/playlists/${resource.slug}/playlist_purchases`

        
      const response = await post(endpoint, {
        responseKind: "json",
        body: JSON.stringify({
          payment: {
            price: data.price,
            optional_message: data.optional_message
          }
        })
      })

      const result = await response.json
      
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      } else {
        throw new Error('No checkout URL provided')
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: I18n.t('shared.music_purchase_form.errors.title'),
        description: I18n.t('shared.music_purchase_form.errors.description'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {I18n.t('shared.music_purchase_form.title', { type })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price">{I18n.t('shared.music_purchase_form.price.label')}</Label>
            {resource.name_your_price ? (
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  {...register('price', {
                    required: I18n.t('shared.music_purchase_form.price.required'),
                    min: {
                      value: resource.price,
                      message: I18n.t('shared.music_purchase_form.price.minimum', { price: resource.price })
                    }
                  })}
                  type="number"
                  step="0.01"
                  placeholder={I18n.t('shared.music_purchase_form.price.name_your_price_placeholder', { price: resource.price })}
                  className="rounded-l-none"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div className="text-xl font-medium">
                    ${resource.price}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {I18n.t('shared.music_purchase_form.price.currency')}
                  </span>
                </div>
                <Input
                  type="hidden"
                  {...register('price')}
                  value={resource.price}
                />
              </>
            )}
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="optional_message">{I18n.t('shared.music_purchase_form.message.label')}</Label>
            <Textarea
              {...register('optional_message')}
              placeholder={I18n.t('shared.music_purchase_form.message.placeholder')}
              className="resize-none"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {I18n.t('shared.music_purchase_form.purchase_includes')}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 
              I18n.t('shared.music_purchase_form.buttons.processing') : 
              I18n.t('shared.music_purchase_form.buttons.complete')
            }
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
