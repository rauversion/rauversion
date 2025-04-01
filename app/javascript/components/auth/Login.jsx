import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { post } from '@rails/request.js'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react'
import { GoogleIcon, DiscordIcon } from './SocialIcons'
import I18n from '@/stores/locales'

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setCurrentUser, updateCsrfToken } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await post('/users/sign_in', {
        responseKind: 'json',
        body: JSON.stringify({
          user: {
            email: data.email,
            password: data.password
          }
        })
      })

      const result = await response.json

      if (response.ok) {
        setCurrentUser(result.user)
        toast({
          title: I18n.t('sessions.toast.success.title'),
          description: I18n.t('sessions.toast.success.message')
        })
        navigate('/')

        const newCsrfToken = response.headers.get("X-CSRF-Token");
        if (newCsrfToken) {
          updateCsrfToken(newCsrfToken);
        }

      } else {
        toast({
          title: I18n.t('sessions.toast.error.title'),
          description: I18n.t('sessions.toast.error.invalid_credentials'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: I18n.t('sessions.toast.error.title'),
        description: I18n.t('sessions.toast.error.generic'),
        variant: 'destructive'
      })

      const newCsrfToken = response.headers.get("X-CSRF-Token");
      if (newCsrfToken) {
        updateCsrfToken(newCsrfToken);
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card/95 backdrop-blur-lg shadow-xl rounded-xl p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">{I18n.t('sessions.title')}</h1>
            <p className="text-muted-foreground">{I18n.t('sessions.subtitle')}</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="email">{I18n.t('sessions.email.label')}</Label>
              <div className="relative mt-2">
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  {...register('email', {
                    required: I18n.t('sessions.email.required'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: I18n.t('sessions.email.invalid')
                    }
                  })}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mt-2"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="password">{I18n.t('sessions.password.label')}</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  {...register('password', {
                    required: I18n.t('sessions.password.required')
                  })}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mt-2"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between"
            >
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {I18n.t('sessions.forgot_pass')}
              </Link>
            </motion.div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  {I18n.t('sessions.or_continue_with')}
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid gap-4"
            >
              <form action="/users/auth/google_oauth2" method="post" className="contents">
                <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                >
                  <GoogleIcon />
                  <span>{I18n.t('sessions.google')}</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </form>

              <form action="/users/auth/discord" method="post" className="contents">
                <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                >
                  <DiscordIcon />
                  <span>{I18n.t('sessions.discord')}</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    {I18n.t('sessions.signing_in')}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {I18n.t('sessions.sign_in')}
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm mt-6"
          >
            {I18n.t('sessions.no_account')}{' '}
            <Link to="/users/sign_up" className="text-primary hover:underline">
              {I18n.t('sessions.register_link')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
