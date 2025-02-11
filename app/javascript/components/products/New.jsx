import React from 'react'
import TypeCard from './TypeCard'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'

const PRODUCT_TYPES = [
  {
    type: 'music',
    color: 'purple',
    iconClass: 'music'
  },
  {
    type: 'gear',
    color: 'blue',
    iconClass: 'gear'
  },
  {
    type: 'merch',
    color: 'pink',
    iconClass: 'merch'
  },
  {
    type: 'accessory',
    color: 'amber',
    iconClass: 'accessory'
  },
  {
    type: 'service',
    color: 'emerald',
    iconClass: 'service'
  }
]

export default function ProductNew() {
  const { currentUser } = useAuthStore()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {I18n.t('products.new.title')}
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
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
