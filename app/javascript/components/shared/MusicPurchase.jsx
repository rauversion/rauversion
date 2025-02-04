import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ShoppingCart } from "lucide-react"
import MusicPurchaseForm from './MusicPurchaseForm'

export default function MusicPurchase({ resource, type, variant = 'default' }) {
  const [purchaseOpen, setPurchaseOpen] = useState(false)

  
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

  const renderPurchaseButton = () => {
    const showFixedPrice = !resource?.name_your_price && resource.price !== "$0.00";
    const buttonText = type === 'Track' ? 'Buy Digital Track' : 'Buy Playlist';

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
            "bg-gradient-to-r from-violet-600 to-indigo-600",
            "text-white rounded-lg shadow-lg",
            "hover:from-violet-500 hover:to-indigo-500",
            "transition-all duration-200 ease-in-out",
            "hover:shadow-indigo-500/25 hover:shadow-xl",
            "border border-indigo-700/20"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{buttonText}</span>
          
          {showFixedPrice && (
            <motion.span 
              className={cn(
                "ml-2 px-2 py-0.5 rounded-md",
                "bg-gradient-to-r from-pink-500/20 to-purple-500/20",
                "backdrop-blur-sm",
                "border border-white/10",
                "text-white font-medium",
                variant === 'mini' ? "text-xs" : "text-sm",
                "shadow-inner"
              )}
              initial={{ opacity: 0.8 }}
              whileHover={{ 
                opacity: 1,
                scale: 1.05,
                background: "linear-gradient(to right, rgba(236,72,153,0.3), rgba(168,85,247,0.3))"
              }}
            >
              {resource.price} USD
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
          
          {resource?.name_your_price && (
            <span className="text-muted text-sm italic ml-2">
              (or more)
            </span>
          )}
        </div>
      )}

      {resource?.supporters?.length > 0 && (
        <div className="sm:text-xl text-sm container mx-auto my-4 flex flex-col space-y-4">
          <h3 className="font-bold font-medium">Supporters</h3>
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
