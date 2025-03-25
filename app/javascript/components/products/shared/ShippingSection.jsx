import React from 'react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from 'lucide-react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useFieldArray } from "react-hook-form"
import Select from "react-select"
import { useThemeStore } from '@/stores/theme'
import selectTheme from "@/components/ui/selectTheme"
import I18n from '@/stores/locales'
import countryList from 'react-select-country-list'

export default function ShippingSection({ control, setValue }) {
  const { isDarkMode } = useThemeStore()
  const countries = React.useMemo(() => countryList().getData(), [])
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "product_shippings_attributes"
  })

  const addShippingOption = () => {
    append({
      id: null,
      country: '',
      base_cost: 0,
      additional_cost: 0
    })
  }

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
          name="shipping_begins_on"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{I18n.t('products.form.shipping.shipping_begins_on')}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {I18n.t('products.form.shipping.shipping_options')}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addShippingOption}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {I18n.t('products.form.shipping.add_shipping_option')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium">
                  {I18n.t('products.form.shipping.option')} {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FormField
                control={control}
                name={`product_shippings_attributes.${index}.country`}
                rules={{ required: "Country is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('products.form.shipping.country')}</FormLabel>
                    <FormControl>
                      <Select
                        options={countries}
                        value={countries.find(c => c.value === field.value)}
                        onChange={(option) => field.onChange(option?.value)}
                        theme={(theme) => selectTheme(theme, isDarkMode)}
                        placeholder={I18n.t('products.form.shipping.select_country')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`product_shippings_attributes.${index}.base_cost`}
                  rules={{
                    required: "Base cost is required",
                    min: {
                      value: 0,
                      message: "Base cost must be greater than or equal to 0"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.form.shipping.base_cost')}</FormLabel>
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
                  name={`product_shippings_attributes.${index}.additional_cost`}
                  rules={{
                    required: "Additional cost is required",
                    min: {
                      value: 0,
                      message: "Additional cost must be greater than or equal to 0"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.form.shipping.additional_cost')}</FormLabel>
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
              </div>

              {/* Hidden field for id when editing */}
              {field.id && (
                <input
                  type="hidden"
                  {...control.register(`product_shippings_attributes.${index}.id`)}
                  value={field.id}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
