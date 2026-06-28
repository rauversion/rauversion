import React from "react"
import { Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import I18n from 'stores/locales'

export default function PricingForm({ control, disabled = false, disabledMessage = null }) {
  return (
    <div className="space-y-4">
      {disabled && disabledMessage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-muted-foreground">
          {disabledMessage}
        </div>
      )}
      <div>
        <Label>{I18n.t('shared.forms.pricing.price.label')}</Label>
       
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <Input
              type="text"
              step="0.01"
              disabled={disabled}
              {...field}
            />
          )}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {I18n.t('shared.forms.pricing.price.hint')}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="name_your_price"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
        <Label>{I18n.t('shared.forms.pricing.name_your_price.label')}</Label>
      </div>
    </div>
  )
}
