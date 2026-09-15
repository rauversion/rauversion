import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ShoppingCart } from "lucide-react"
import MusicPurchaseForm from './MusicPurchaseForm'
import I18n from 'stores/locales'

export default function MusicPurchase({ resource, type, variant = 'default' }) {
  const [purchaseOpen, setPurchaseOpen] = useState(false)

  if (resource?.dj_set) return null

  const classes = variant === 'mini' ? {
    wrapper: "inline-flex",
    text: "text-sm",
    pad: "px-3 py-2",
    m: "my-2"
  } : {
    wrapper: "inline-flex",
    text: "text-base",
    pad: "px-4 py-3",
    m: "my-4"
  }

  const handlePurchaseClick = (e) => {
    e.preventDefault()
    setPurchaseOpen(true)
  }

  const getPriceDisplay = () => {
    if (resource?.name_your_price) {
      return resource.price ? `${resource.formatted_price} ${I18n.t('shared.music_purchase.price.or_more')}` : I18n.t('shared.music_purchase.price.name_your_price')
    }
    return resource.price ? `${resource.formatted_price} ${I18n.t('shared.music_purchase.price.currency')}` : ''
  }

  const renderPurchaseButton = () => {
    const buttonText = type === 'Track' ? 
      I18n.t('shared.music_purchase.track.button') : 
      I18n.t('shared.music_purchase.playlist.button')
    const priceDisplay = getPriceDisplay()

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        <button 
          onClick={handlePurchaseClick}
          className={cn(
            classes.wrapper,
            classes.pad,
            "items-center gap-2 font-medium group",
            "bg-gradient-to-r from-primary to-accent",
            "text-primary-foreground rounded-lg shadow-lg",
            "hover:from-primary/90 hover:to-accent/90",
            "transition-all duration-200 ease-in-out",
            "hover:shadow-xl",
            "border border-primary/20"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{buttonText}</span>
          
          {priceDisplay && (
            <motion.span 
              className={cn(
                "ml-2 px-2 py-0.5 rounded-md",
                "bg-gradient-to-r from-primary-foreground/10 to-accent-foreground/15",
                "backdrop-blur-sm",
                "border border-primary-foreground/15",
                "text-primary-foreground font-medium",
                variant === 'mini' ? "text-xs" : "text-sm",
                "shadow-inner"
              )}
              initial={{ opacity: 0.8 }}
              whileHover={{ 
                opacity: 1,
                scale: 1.05,
                background: "linear-gradient(to right, color-mix(in srgb, var(--primary-foreground) 20%, transparent), color-mix(in srgb, var(--accent-foreground) 24%, transparent))"
              }}
            >
              {priceDisplay}
            </motion.span>
          )}
        </button>
      </motion.div>
    )
  }

  return (
    <div className={classes.m}>
      {(resource?.name_your_price || (resource.price && resource.price !== "$0.00")) && (
        <div className={cn(classes.text, "space-x-2")}>
          {renderPurchaseButton()}
        </div>
      )}

      {resource?.supporters?.length > 0 && (
        <div className="sm:text-xl text-sm container mx-auto my-4 flex flex-col space-y-4">
          <h3 className="font-bold font-medium">{I18n.t('shared.music_purchase.supporters.title')}</h3>
          <div className="-space-x-4 flex items-center">
            {resource.supporters.map((supporter) => (
              <motion.div
                key={supporter.id}
                whileHover={{ scale: 1.1, zIndex: 40 }}
                className="relative"
              >
                <Link to={`/${supporter.username}`}>
                  <img 
                    src={supporter.cover_url?.small} 
                    className="inline object-cover w-10 h-10 border-2 border-white rounded-full shadow-md" 
                    alt={supporter.username}
                  />
                  <span className="sr-only">{supporter.username}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <MusicPurchaseForm
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        resource={resource}
        type={type}
      />
    </div>
  )
}
