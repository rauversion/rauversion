import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { get, post } from '@rails/request.js'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, ArrowLeft, Mail, User, Lock } from 'lucide-react'
import { GoogleIcon, DiscordIcon } from './SocialIcons'
import ConfirmationMessage from './ConfirmationMessage'

const steps = [
  {
    id: 'email',
    label: 'What\'s your email?',
    icon: Mail,
    fields: ['email']
  },
  {
    id: 'username',
    label: 'Choose a username',
    icon: User,
    fields: ['username']
  },
  {
    id: 'password',
    label: 'Create a password',
    icon: Lock,
    fields: ['password', 'password_confirmation']
  }
]

export default function Register() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaField, setCaptchaField] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [spinner, setSpinner] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setCurrentUser } = useAuthStore()
  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm()
  const password = watch('password')

  useEffect(() => {
    const fetchCaptchaField = async () => {
      try {
        const response = await get('/users/sign_up', {
          responseKind: 'json'
        })
        const data = await response.json
        setCaptchaField(data.invisible_captcha.field_name)
        setSpinner(data.invisible_captcha.spinner)
      } catch (error) {
        console.error('Error fetching captcha field:', error)
      }
    }
    fetchCaptchaField()
  }, [])

  const nextStep = async () => {
    const fields = steps[currentStep].fields
    const isValid = await trigger(fields)
    if (isValid) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)

    try {
      
      const payload = {
        email: data.email,
        username: data.username,
        password: data.password,
        password_confirmation: data.password_confirmation,
        spinner: spinner,
        [captchaField]: null //data[captchaField] // dynamic honeypot field
      }

      const response = await post('/users', {
        responseKind: 'json',
        body: JSON.stringify({
          user: payload
        })
      })

      const result = await response.json

      if (response.ok) {
        if (result.error === 'unconfirmed') {
          setRegisteredEmail(data.email)
          setShowConfirmation(true)
        } else {
          setCurrentUser(result.user)
          toast({
            title: 'Welcome aboard! 🎉',
            description: 'Your account has been created successfully'
          })
          navigate('/')
        }
      } else {
        if (result.error === 'unconfirmed') {
          setRegisteredEmail(data.email)
          setShowConfirmation(true)
          return
        }
        toast({
          title: 'Error',
          description: result.errors?.join(', ') || 'Registration failed',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showConfirmation) {
    return <ConfirmationMessage email={registeredEmail} />
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
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">Join our community of creators</p>
          </motion.div>

          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted transform -translate-y-1/2">
              <motion.div
                className="absolute top-0 left-0 h-full bg-primary"
                style={{ borderRadius: 4 }}
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative"
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {captchaField && (
              <input
                {...register(captchaField)}
                type="text"
                tabIndex="-1"
                autoComplete="off"
                className="absolute top-0 left-0 w-1 h-1 -z-10 opacity-0"
              />
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        className="pl-10"
                        {...register('username', {
                          required: 'Username is required',
                          pattern: {
                            value: /^[a-zA-Z0-9_-]+$/,
                            message: 'Username can only contain letters, numbers, underscores and dashes'
                          },
                          minLength: {
                            value: 3,
                            message: 'Username must be at least 3 characters'
                          }
                        })}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.username && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {errors.username.message}
                      </motion.p>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          className="pl-10"
                          {...register('password', {
                            required: 'Password is required',
                            minLength: {
                              value: 6,
                              message: 'Password must be at least 6 characters'
                            }
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

                    <div>
                      <Label htmlFor="password_confirmation">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          type="password"
                          className="pl-10"
                          {...register('password_confirmation', {
                            required: 'Please confirm your password',
                            validate: value =>
                              value === password || 'The passwords do not match'
                          })}
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-4">
              {currentStep > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or register with</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                <span>Continue with Google</span>
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
                <span>Continue with Discord</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm mt-6"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
