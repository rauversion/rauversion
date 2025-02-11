import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import I18n from '@/stores/locales'

export default function PricingSection({ register, watch }) {
  const acceptBarter = watch('accept_barter')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{I18n.t('products.form.pricing.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="price">{I18n.t('products.form.pricing.price')}</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            id="price"
            {...register('price', { required: true })}
          />
        </div>

        <div>
          <Label htmlFor="compare_at_price">
            {I18n.t('products.form.pricing.compare_at_price')}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            id="compare_at_price"
            {...register('compare_at_price')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="accept_barter"
            {...register('accept_barter')}
          />
          <Label htmlFor="accept_barter">
            {I18n.t('products.form.pricing.accept_barter')}
          </Label>
        </div>

        {acceptBarter && (
          <div>
            <Label htmlFor="barter_description">
              {I18n.t('products.form.pricing.barter_description')}
            </Label>
            <Input
              id="barter_description"
              {...register('barter_description')}
              placeholder={I18n.t('products.form.pricing.barter_description_placeholder')}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
