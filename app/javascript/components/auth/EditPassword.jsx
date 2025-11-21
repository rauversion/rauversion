import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { get, put } from '@rails/request.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Lock, Check } from 'lucide-react'

export default function EditPassword() {
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('reset_password_token')

  const { toast } = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [minLength, setMinLength] = useState(null)

  const { register, handleSubmit, setError, formState: { errors } } = useForm()

  useEffect(() => {
    // Si no viene token en la URL, no tiene sentido mostrar el formulario
    if (!resetToken) {
      toast({
        title: 'Invalid link',
        description: 'The password reset link is invalid or has expired.',
        variant: 'destructive'
      })
      navigate('/forgot-password')
      return
    }

    // Intentamos cargar meta-información del reset (por ahora solo min length)
    const fetchMeta = async () => {
      try {
        const response = await get(`/users/password/edit.json?reset_password_token=${encodeURIComponent(resetToken)}`, {
          responseKind: 'json'
        })

        if (response.ok) {
          const data = await response.json
          const length = data?.reset_password?.minimum_password_length
          if (length) setMinLength(length)
        }
      } catch (e) {
        // Silencioso: no es crítico para el flujo
        console.error('Error loading password meta info', e)
      }
    }

    fetchMeta()
  }, [resetToken, toast, navigate])

  const onSubmit = async (data) => {
    if (!resetToken) {
      toast({
        title: 'Invalid link',
        description: 'The password reset link is invalid or has expired.',
        variant: 'destructive'
      })
      return
    }

    if (data.password !== data.password_confirmation) {
      setError('password_confirmation', {
        type: 'manual',
        message: 'Passwords do not match'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await put('/users/password', {
        responseKind: 'json',
        body: JSON.stringify({
          user: {
            reset_password_token: resetToken,
            password: data.password,
            password_confirmation: data.password_confirmation
          }
        })
      })

      const result = await response.json

      if (response.ok) {
        toast({
          title: 'Password updated',
          description: 'Your password has been changed successfully. You can now log in with your new password.'
        })
        navigate('/users/sign_in')
      } else {
        const errorsFromServer = result?.errors || result?.error || result?.full_messages

        if (Array.isArray(errorsFromServer) && errorsFromServer.length > 0) {
          toast({
            title: 'Error',
            description: errorsFromServer.join(', '),
            variant: 'destructive'
          })
        } else if (typeof errorsFromServer === 'string') {
          toast({
            title: 'Error',
            description: errorsFromServer,
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Error',
            description: 'Failed to reset password',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
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
            <h1 className="text-3xl font-bold mb-2">Change your password</h1>
            <p className="text-muted-foreground">
              Enter your new password below.
              {minLength && (
                <span className="block text-xs mt-1">
                  Minimum length: {minLength} characters
                </span>
              )}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  className="pl-10"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: minLength
                      ? {
                        value: minLength,
                        message: `Password must be at least ${minLength} characters`
                      }
                      : undefined
                  })}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type="password"
                  className="pl-10"
                  autoComplete="new-password"
                  {...register('password_confirmation', {
                    required: 'Please confirm your password'
                  })}
                />
                <Check className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.password_confirmation && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.password_confirmation.message}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Updating password...
                </>
              ) : (
                'Change my password'
              )}
            </Button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm mt-6"
          >
            Remembered your password?{' '}
            <Link to="/users/sign_in" className="text-primary hover:underline">
              Back to login
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
