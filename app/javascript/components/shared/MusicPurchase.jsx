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
    if (type === 'Track') {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button 
            onClick={handlePurchaseClick}
            className={cn(
              classes.wrapper,
              classes.pad,
              "items-center gap-2 font-medium",
              "bg-gradient-to-r from-violet-600 to-indigo-600",
              "text-white rounded-lg shadow-lg",
              "hover:from-violet-500 hover:to-indigo-500",
              "transition-all duration-200 ease-in-out",
              "hover:shadow-indigo-500/25 hover:shadow-xl",
              "border border-indigo-700/20"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy Digital Track</span>
          </button>
        </motion.div>
      )
    }

    if (type === 'Playlist') {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button 
            onClick={handlePurchaseClick}
            className={cn(
              classes.wrapper,
              classes.pad,
              "items-center gap-2 font-medium",
              "bg-gradient-to-r from-violet-600 to-indigo-600",
              "text-white rounded-lg shadow-lg",
              "hover:from-violet-500 hover:to-indigo-500",
              "transition-all duration-200 ease-in-out",
              "hover:shadow-indigo-500/25 hover:shadow-xl",
              "border border-indigo-700/20"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy Playlist</span>
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-md text-sm">
              ${resource.price} USD
            </span>
          </button>
        </motion.div>
      )
    }

    return null
  }

  return (
    <div className={classes.m}>
      {(resource?.name_your_price || resource.price !== "$0.00") && (
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
