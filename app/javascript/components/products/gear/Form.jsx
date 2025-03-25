import React, { useState } from 'react'
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
import DeleteButton from '../shared/DeleteButton'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { post, patch } from '@rails/request.js'
import {
  GEAR_CATEGORIES, STATUSES, CONDITIONS
} from '../shared/constants'


export default function GearForm({ product, isEditing = false }) {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useThemeStore()
  const { username, slug } = useParams()
  
  const form = useForm({
    defaultValues: {
      category: product?.category || '',
      brand: product?.brand || '',
      model: product?.model || '',
      year: product?.year || new Date().getFullYear(),
      condition: product?.condition || '',
      title: product?.title || '',
      description: product?.description || '',
      accept_barter: product?.accept_barter || false,
      barter_description: product?.barter_description || '',
      price: product?.price || '',
      stock_quantity: product?.stock_quantity || '',
      sku: product?.sku || '',
      status: product?.status || 'active',
      shipping_days: product?.shipping_days || '',
      shipping_begins_on: product?.shipping_begins_on || '',
      visibility: product?.visibility || 'public',
      name_your_price: product?.name_your_price || false,
      quantity: product?.quantity || 1,
      product_images_attributes: product?.product_images || [],
      product_shippings_attributes: product?.shipping_options?.map(option => ({
        id: option.id,
        country: option.country,
        base_cost: option.base_cost,
        additional_cost: option.additional_cost
      })) || []
    }
  })

  const [backendErrors, setBackendErrors] = useState(null)

  const onSubmit = async (data) => {
    try {
      // Clear any existing errors before submitting
      form.clearErrors()

      // Prepare the data
      const formData = {
        ...data,
        product_images_attributes: data.product_images_attributes.map(img => ({
          id: img.id,
          title: img.title,
          description: img.description,
          image: img.image,
          _destroy: img._destroy
        })).filter(img => img.image || img._destroy) // Only send images that have content or are marked for deletion
      }

      let response;
      let targetUsername = isEditing ? username : currentUser.username;
      
      if (isEditing) {
        response = await patch(`/${targetUsername}/products/gear/${slug}.json`, {
          responseKind: 'json',
          body: { product: formData }
        });
      } else {
        response = await post(`/${targetUsername}/products/gear.json`, {
          responseKind: 'json',
          body: { product: formData }
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

  // Reset form errors when any field changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (Object.keys(form.formState.errors).length > 0) {
        form.clearErrors()
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

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
            ? I18n.t('products.gear.edit.title') 
            : I18n.t('products.gear.new.title')}
        </h2>

        <FormErrors errors={backendErrors} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
            
            <div className="block pt-0 space-y-3 md:col-span-2">

              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('products.gear.form.title')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('products.gear.form.category')}</FormLabel>
                    <FormControl>
                      <Select
                        id="category"
                        placeholder={I18n.t('products.gear.form.select_category')}
                        options={GEAR_CATEGORIES}
                        value={GEAR_CATEGORIES.find(c => c.value === field.value)}
                        onChange={(option) => field.onChange(option?.value)}
                        theme={(theme) => selectTheme(theme, isDarkMode)}
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
                  rules={{ required: "Brand is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.gear.form.brand')}</FormLabel>
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
                  rules={{ required: "Model is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.gear.form.model')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="year"
                  rules={{
                    required: "Year is required",
                    min: {
                      value: 1900,
                      message: "Year must be 1900 or later"
                    },
                    max: {
                      value: new Date().getFullYear(),
                      message: "Year cannot be in the future"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{I18n.t('products.gear.form.year')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  rules={{ required: "Condition is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                      {I18n.t('products.gear.form.condition')}
                      </FormLabel>
                      <FormControl>
                        <Select
                          id="condition"
                          placeholder={I18n.t('products.gear.form.select_condition')}
                          options={Object.keys(CONDITIONS).map(key => ({ value: key, label: CONDITIONS[key] }))}
                          value={field.value ? { value: field.value, label: CONDITIONS[field.value] } : null}
                          onChange={(option) => field.onChange(option?.value)}
                          theme={(theme) => selectTheme(theme, isDarkMode)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('products.gear.form.status')}</FormLabel>
                    <FormControl>
                      <Select
                        id="status"
                        placeholder={I18n.t('products.gear.form.select_status')}
                        options={STATUSES}
                        value={STATUSES.find(s => s.value === field.value)}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t('products.gear.form.description')}</FormLabel>
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
            </div>

            <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
              <PricingSection control={form.control} form={form} />
              <PhotosSection control={form.control} setValue={form.setValue} watch={form.watch} />
              <ShippingSection control={form.control} />

              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? I18n.t('products.form.submitting')
                    : isEditing 
                      ? I18n.t('products.form.update')
                      : I18n.t('products.form.submit')}
                </Button>
                {isEditing && (
                  <DeleteButton product={product} />
                )}
              </div>
            </div>
          </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
