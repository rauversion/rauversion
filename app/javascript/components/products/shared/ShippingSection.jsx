import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import I18n from '@/stores/locales'

export default function ShippingSection({ register, watch }) {
  const shipsInternationally = watch('ships_internationally')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{I18n.t('products.form.shipping.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="shipping_cost">
            {I18n.t('products.form.shipping.shipping_cost')}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            id="shipping_cost"
            {...register('shipping_cost')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="ships_internationally"
            {...register('ships_internationally')}
          />
          <Label htmlFor="ships_internationally">
            {I18n.t('products.form.shipping.ships_internationally')}
          </Label>
        </div>

        {shipsInternationally && (
          <div>
            <Label htmlFor="international_shipping_cost">
              {I18n.t('products.form.shipping.international_shipping_cost')}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              id="international_shipping_cost"
              {...register('international_shipping_cost')}
            />
          </div>
        )}

        <div>
          <Label htmlFor="shipping_notes">
            {I18n.t('products.form.shipping.shipping_notes')}
          </Label>
          <Textarea
            id="shipping_notes"
            {...register('shipping_notes')}
            placeholder={I18n.t('products.form.shipping.shipping_notes_placeholder')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="local_pickup"
            {...register('local_pickup')}
          />
          <Label htmlFor="local_pickup">
            {I18n.t('products.form.shipping.local_pickup')}
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
