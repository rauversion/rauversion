import React from "react"
import { Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export default function PricingForm({ control }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Price</Label>
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              step="0.01"
              {...field}
            />
          )}
        />
        <p className="text-sm text-muted-foreground mt-1">
          $0 or more. We apply a fee when price is higher than $0.
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
            />
          )}
        />
        <Label>Let fans pay more if they want</Label>
      </div>
    </div>
  )
}
