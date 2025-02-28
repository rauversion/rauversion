import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
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
import FormErrors from '../shared/FormErrors'
import PricingSection from '../shared/PricingSection'
import ShippingSection from '../shared/ShippingSection'
import PhotosSection from '../shared/PhotosSection'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { post, patch } from '@rails/request.js'

const ACCESSORY_CATEGORIES = [
  { value: 'cables', label: 'Cables' },
  { value: 'cases', label: 'Cases' },
  { value: 'stands', label: 'Stands' },
  { value: 'other', label: 'Other' }
]

export default function AccessoryForm({ product, isEditing = false }) {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useThemeStore()
  const { username, slug } = useParams()
  
  const form = useForm({
    defaultValues: {
      category: product?.category || '',
      title: product?.title || '',
      description: product?.description || '',
      brand: product?.brand || '',
      model: product?.model || '',
      price: product?.price || '',
      sku: product?.sku || '',
      stock_quantity: product?.stock_quantity || '',
      status: product?.status || 'active',
      shipping_days: product?.shipping_days || '',
      shipping_begins_on: product?.shipping_begins_on || '',
      visibility: product?.visibility || 'public',
      name_your_price: product?.name_your_price || false,
      quantity: product?.quantity || 1,
      product_images_attributes: product?.photos || [],
      product_shippings_attributes: product?.shipping_options?.map(option => ({
        id: option.id,
        country: option.country,
        base_cost: option.base_cost,
        additional_cost: option.additional_cost
      })) || []
    }
  })

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

      let response;
      let targetUsername = isEditing ? username : currentUser.username;
      
      if (isEditing) {
        response = await patch(`/${targetUsername}/products/accessory/${slug}`, {
          responseKind: 'json',
          body: { product: data }
        });
      } else {
        response = await post(`/${targetUsername}/products/accessory`, {
          responseKind: 'json',
          body: { product: data }
        });
      }
      
      const result = await response.json
      
      if (response.ok) {
        navigate(`/${targetUsername}/products/${result.product.slug}`)
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
      console.error(`Failed to ${isEditing ? 'update' : 'create'} product:`, error)
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
            onClick={() => navigate(`/${isEditing ? username : currentUser.username}/products`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {isEditing 
            ? I18n.t('products.accessory.edit.title') 
            : I18n.t('products.accessory.new.title')}
        </h2>

        <FormErrors errors={form.formState.errors} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
              <div className="block pt-0 space-y-3 md:col-span-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.accessory.form.category')}</FormLabel>
                      <FormControl>
                        <Select
                          id="category"
                          placeholder={I18n.t('products.accessory.form.select_category')}
                          options={ACCESSORY_CATEGORIES}
                          value={ACCESSORY_CATEGORIES.find(c => c.value === field.value)}
                          onChange={(option) => field.onChange(option?.value)}
                          theme={(theme) => selectTheme(theme, isDarkMode)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.accessory.form.title')}</FormLabel>
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
                      <FormLabel>{I18n.t('products.accessory.form.description')}</FormLabel>
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
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('products.accessory.form.brand')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{I18n.t('products.accessory.form.model')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
                <PricingSection control={form.control} />
                <PhotosSection control={form.control} setValue={form.setValue} watch={form.watch} />
                <ShippingSection control={form.control} />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? I18n.t('products.accessory.form.submitting')
                    : isEditing 
                      ? I18n.t('products.accessory.form.update')
                      : I18n.t('products.accessory.form.submit')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
