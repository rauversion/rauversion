import React from 'react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import I18n from '@/stores/locales'

export default function ShippingSection({ control }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{I18n.t('products.form.shipping.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="shipping_days"
          rules={{
            required: "Shipping days is required",
            min: {
              value: 1,
              message: "Shipping days must be at least 1"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('products.form.shipping.shipping_days')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="shipping_cost"
          rules={{
            min: {
              value: 0,
              message: "Shipping cost must be greater than or equal to 0"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('products.form.shipping.shipping_cost')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ships_internationally"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {I18n.t('products.form.shipping.ships_internationally')}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="international_shipping_cost"
          rules={{
            min: {
              value: 0,
              message: "International shipping cost must be greater than or equal to 0"
            }
          }}
          render={({ field }) => {
            const shipsInternationally = control._formValues.ships_internationally
            if (!shipsInternationally) return null

            return (
              <FormItem>
                <FormLabel>{I18n.t('products.form.shipping.international_shipping_cost')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormField
          control={control}
          name="shipping_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('products.form.shipping.shipping_notes')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={I18n.t('products.form.shipping.shipping_notes_placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="local_pickup"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {I18n.t('products.form.shipping.local_pickup')}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
