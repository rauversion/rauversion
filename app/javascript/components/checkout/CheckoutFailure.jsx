import React from "react"
import { motion } from "framer-motion"
import { XCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Link } from "react-router-dom"
import useCartStore from "@/stores/cartStore"

export default function CheckoutFailure() {
  const { cart } = useCartStore()


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg text-center space-y-6"
      >
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <XCircle className="w-20 h-20 text-destructive mx-auto" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold tracking-tight">Payment Failed</h1>
          <p className="text-muted-foreground">
            We couldn't process your payment. Don't worry, your cart items are still saved.
          </p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {cart && cart.items?.length > 0 && (
            <Button asChild className="w-full">
              <Link to="/cart">Return to Cart</Link>
            </Button>
          )}
          
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Continue Shopping</Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            If you continue to experience issues, please contact our support team.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
