import React, { useState } from 'react'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import I18n from '@/stores/locales'

const STORE_SECTIONS = [
  { id: 'all', label: 'All', path: '/store' },
  { id: 'services', label: 'Services', path: '/store/services' },
  { id: 'music', label: 'Music', path: '/store/music' },
  { id: 'classes', label: 'Classes', path: '/store/classes' },
  { id: 'feedback', label: 'Feedback', path: '/store/feedback' },
  { id: 'accessories', label: 'Accessories', path: '/store/accessories' },
  { id: 'gear', label: 'Gear', path: '/store/gear' }
]

function ProductCard({ product }) {
  return (
    <div className="bg-black/20 rounded-lg overflow-hidden">
      <div className="relative aspect-square">
        {product.cover_url && <img
          src={product.cover_url.medium}
          alt={product.title}
          className="w-full h-full object-cover"
        />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={product.user.avatar_url.small}
              alt={product.user.username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-white">{product.user.username}</span>
          </div>
          <h3 className="text-lg font-bold text-white truncate">{product.title}</h3>
          <p className="text-sm text-gray-300 line-clamp-2">{product.description}</p>
        </div>
      </div>
      <div className="p-4 flex justify-between items-center">
        <span className="text-lg font-bold text-white">${product.price}</span>
        {product.variants?.length > 0 ? (
          <span className="text-sm text-gray-400">{product.variants.length} variants</span>
        ) : null}
      </div>
    </div>
  )
}

export default function StoreIndex() {
  const location = useLocation()
  const currentPath = location.pathname
  const currentSection = STORE_SECTIONS.find(section => section.path === currentPath) || STORE_SECTIONS[0]
  
  const {
    items: products,
    loading,
    lastElementRef
  } = useInfiniteScroll(`${currentPath}.json`)

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" aria-label={I18n.t('loading')}></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {I18n.t('store.title')}
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          {I18n.t('store.description')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {STORE_SECTIONS.map((section) => (
          <Link
            key={section.id}
            to={section.path}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentSection.id === section.id
                ? 'bg-brand-600 text-white'
                : 'bg-black/20 text-gray-300 hover:bg-black/30'
            }`}
          >
            {section.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            ref={index === products.length - 1 ? lastElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={`${product.path}`}>
              <ProductCard product={product} />
            </Link>
          </motion.div>
        ))}
      </div>

      {loading && products.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">{I18n.t('store.no_products')}</p>
        </div>
      )}
    </div>
  )
}
