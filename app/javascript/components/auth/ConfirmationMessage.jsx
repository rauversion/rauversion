import React from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function ConfirmationMessage({ email }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/95 backdrop-blur-lg shadow-xl rounded-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Mail className="w-8 h-8 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-4"
          >
            Check your email
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-6"
          >
            We've sent a confirmation link to{' '}
            <span className="font-medium text-foreground">{email}</span>
            <br />
            Please click the link to activate your account.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://mail.google.com', '_blank')}
            >
              Open Gmail
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-sm text-muted-foreground">
              Didn't receive the email?{' '}
              <Link to="/users/confirmation/new" className="text-primary hover:underline">
                Click here to resend
              </Link>
            </p>

            <p className="text-sm text-muted-foreground">
              Return to{' '}
              <Link to="/users/sign_in" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
