import React from "react"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Link } from "react-router-dom"
import I18n from '@/stores/locales'

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold tracking-tight">{I18n.t('products.checkout.success.title')}</h1>
          <p className="text-muted-foreground">
            {I18n.t('products.checkout.success.message')}
          </p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <Button asChild className="w-full">
            <Link to="/purchases">{I18n.t('products.checkout.success.view_orders')}</Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link to="/">{I18n.t('products.checkout.success.continue_shopping')}</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
