import React from 'react'
import TypeCard from './TypeCard'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { PRODUCT_TYPES } from './shared/constants'
import { InterestAlert } from '../shared/alerts'
import { useToast } from "@/hooks/use-toast"


export default function ProductNew() {
  const { currentUser } = useAuthStore()
  const { toast } = useToast()

  const handleSellerInterest = async () => {
    // Mock success for now, will implement API call later
    toast({
      title: "Success!",
      description: "Your interest in becoming a seller has been submitted. We'll review your request shortly.",
    })
  }

  if (!currentUser?.can_sell_products) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InterestAlert 
          type="seller"
          onSubmit={handleSellerInterest}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground dark:text-white">
          {I18n.t('products.new.title')}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground dark:text-muted-foreground">
          {I18n.t('products.new.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
        {PRODUCT_TYPES.map((type) => (
          <TypeCard
            key={type.type}
            title={I18n.t(`products.new.types.${type.type}.title`)}
            description={I18n.t(`products.new.types.${type.type}.description`)}
            iconClass={type.iconClass}
            color={type.color}
            path={`/${currentUser.username}/products/${type.type}/new`}
          />
        ))}
      </div>
    </div>
  )
}
