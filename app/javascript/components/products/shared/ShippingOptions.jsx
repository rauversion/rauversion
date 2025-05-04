import React from "react"
import { Truck } from "lucide-react"
import I18n from "@/stores/locales"

export default function ShippingOptions({ product }) {
  if (!product?.shipping_options?.length) return null

  return (
    <div className="space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Truck className="h-4 w-4" />
        {I18n.t('products.music.show.shipping')}
      </h4>
      {product.shipping_options.map((option) => (
        <div key={option.id} className="flex items-center justify-between text-sm">
          <span>{option.country}</span>
          <div className="text-right">
            <div>{option.base_cost}</div>
            <div className="text-muted-foreground text-xs">
              {product.shipping_days} {I18n.t('products.music.show.business_days')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
