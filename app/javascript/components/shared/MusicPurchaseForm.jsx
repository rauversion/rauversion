import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { post } from '@rails/request.js'

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
        title: "Error",
        description: "There was a problem processing your purchase.",
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
            Buy Digital {type}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            {resource.name_your_price ? (
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  {...register('price', {
                    required: 'Price is required',
                    min: {
                      value: resource.price,
                      message: `Minimum price is $${resource.price}`
                    }
                  })}
                  type="number"
                  step="0.01"
                  placeholder={`Name your price (minimum $${resource.price})`}
                  className="rounded-l-none"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div className="text-xl font-medium">
                    ${resource.price}
                  </div>
                  <span className="text-sm text-muted-foreground">USD</span>
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
            <Label htmlFor="optional_message">Message (optional)</Label>
            <Textarea
              {...register('optional_message')}
              placeholder="Add a message to the artist..."
              className="resize-none"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Your purchase includes unlimited streaming via the Rauversion app, plus high-quality download in MP3, FLAC and more.
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : 'Complete Purchase'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
