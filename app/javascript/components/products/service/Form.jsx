import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Form } from "@/components/ui/form"
import Select from "react-select"
import { useThemeStore } from '@/stores/theme'
import selectTheme from "@/components/ui/selectTheme"
import SimpleEditor from "@/components/ui/SimpleEditor"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import FormErrors from '../shared/FormErrors'
import PricingSection from '../shared/PricingSection'
import PhotosSection from '../shared/PhotosSection'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { post } from '@rails/request.js'

const SERVICE_TYPES = [
  { value: 'lessons', label: 'Lessons' },
  { value: 'classes', label: 'Classes' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'production', label: 'Production' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' }
]

const DELIVERY_METHODS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
]

export default function ServiceForm() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useThemeStore()
  
  const form = useForm({
    defaultValues: {
      category: '',
      delivery_method: '',
      title: '',
      description: '',
      duration_minutes: 60,
      max_participants: 1,
      prerequisites: '',
      what_to_expect: '',
      cancellation_policy: '',
      photos: []
    }
  })

  const category = form.watch('category')

  // Reset form errors when any field changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(form.formState.errors).length > 0) {
        form.clearErrors()
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (data) => {
    try {
      // Clear any existing errors before submitting
      form.clearErrors()

      const response = await post(`/${currentUser.username}/products/service`, {
        responseKind: 'json',
        body: { product: data }
      })
      
      const result = await response.json
      
      if (response.ok) {
        navigate(`/${currentUser.username}/products/${result.product.slug}`)
      } else {
        // Set field errors from backend
        Object.keys(result.errors).forEach(key => {
          form.setError(key, {
            type: 'backend',
            message: result.errors[key].join(', ')
          })
        })
      }
    } catch (error) {
      console.error('Failed to create product:', error)
      form.setError('root', {
        type: 'backend',
        message: 'An unexpected error occurred'
      })
    }
  }

  return (
    <div className="m-4 rounded-lg border border-default bg-card text-card-foreground shadow-sm">
      <div className="p-6 pt-0 space-y-6">
        <h2 className="text-2xl py-4 font-bold flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/${currentUser.username}/products`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {I18n.t('products.service.new.title')}
        </h2>

        <FormErrors errors={form.formState.errors} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
              <div className="block pt-0 space-y-3 md:col-span-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="category"
                      rules={{ required: "Category is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{I18n.t('products.service.form.category')}</FormLabel>
                          <FormControl>
                            <Select
                              id="category"
                              placeholder={I18n.t('products.service.form.select_category')}
                              options={SERVICE_TYPES}
                              value={SERVICE_TYPES.find(t => t.value === field.value)}
                              onChange={(option) => field.onChange(option?.value)}
                              theme={(theme) => selectTheme(theme, isDarkMode)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="delivery_method"
                      rules={{ required: "Delivery method is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{I18n.t('products.service.form.delivery_method')}</FormLabel>
                          <FormControl>
                            <Select
                              id="delivery_method"
                              placeholder={I18n.t('products.service.form.select_delivery_method')}
                              options={DELIVERY_METHODS}
                              value={DELIVERY_METHODS.find(m => m.value === field.value)}
                              onChange={(option) => field.onChange(option?.value)}
                              theme={(theme) => selectTheme(theme, isDarkMode)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.service.form.title')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.service.form.description')}</FormLabel>
                      <FormControl>
                        <SimpleEditor
                          value={field.value}
                          onChange={field.onChange}
                          scope="product"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    rules={{
                      required: "Duration is required",
                      min: {
                        value: 15,
                        message: "Duration must be at least 15 minutes"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('products.service.form.duration')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="15"
                            step="15"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {category === 'classes' && (
                    <FormField
                      control={form.control}
                      name="max_participants"
                      rules={{
                        required: "Maximum participants is required",
                        min: {
                          value: 1,
                          message: "Must have at least 1 participant"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{I18n.t('products.service.form.max_participants')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{I18n.t('products.service.form.details')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="prerequisites"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{I18n.t('products.service.form.prerequisites')}</FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              plain
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="what_to_expect"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{I18n.t('products.service.form.what_to_expect')}</FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              plain
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cancellation_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{I18n.t('products.service.form.cancellation_policy')}</FormLabel>
                          <FormControl>
                            <SimpleEditor
                              value={field.value}
                              onChange={field.onChange}
                              scope="product"
                              plain
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <PricingSection control={form.control} />
                <PhotosSection control={form.control} setValue={form.setValue} watch={form.watch} />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? I18n.t('products.service.form.submitting')
                    : I18n.t('products.service.form.submit')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
