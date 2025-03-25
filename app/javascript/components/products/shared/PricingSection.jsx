import React from 'react'
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"

import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import I18n from '@/stores/locales'

export default function PricingSection({ control, isPriceOnly, form  }) {

  const accepsBarter = form.watch('accept_barter')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{I18n.t('products.form.pricing.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="price"
          rules={{ 
            required: "Price is required",
            min: {
              value: 0,
              message: "Price must be greater than or equal to 0"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('products.form.pricing.price')}</FormLabel>
              <FormControl>
                <CurrencyInput
                  currencySymbol="$"
                  currency="USD"
                  placeholder="0.00"
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

        {!isPriceOnly && (
          <>
            <FormField
              control={control}
              name="stock_quantity"
              rules={{
                required: "Stock quantity is required",
                min: {
                  value: 0,
                  message: "Stock quantity must be greater than or equal to 0"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('products.form.pricing.stock_quantity')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
              name="sku"
              rules={{
                required: "SKU is required"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t('products.form.pricing.sku')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {
              /*
                <FormField
                  control={control}
                  name="compare_at_price"
                  rules={{
                    min: {
                      value: 0,
                      message: "Compare at price must be greater than or equal to 0"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.form.pricing.compare_at_price')}</FormLabel>
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
              */
            }

            <FormField
              control={control}
              name="accept_barter"
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
                      {I18n.t('products.form.pricing.accept_barter')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {accepsBarter && <FormField
              control={control}
              name="barter_description"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>{I18n.t('products.form.pricing.barter_description')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={I18n.t('products.form.pricing.barter_description_placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />}
          </>
        )}

      </CardContent>
    </Card>
  )
}
