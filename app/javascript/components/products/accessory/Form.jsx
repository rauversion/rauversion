import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { post } from '@rails/request.js'

const ACCESSORY_CATEGORIES = [
  { value: 'cables', label: 'Cables' },
  { value: 'cases', label: 'Cases' },
  { value: 'stands', label: 'Stands' },
  { value: 'other', label: 'Other' }
]

export default function AccessoryForm() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useThemeStore()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      category: '',
      title: '',
      description: '',
      brand: '',
      model: '',
      photos: []
    }
  })

  const onSubmit = async (data) => {
    try {
      const response = await post(`/${currentUser.username}/products/accessory`, {
        body: { product: data }
      })
      
      if (response.ok) {
        const result = await response.json
        navigate(`/${currentUser.username}/products/${result.product.slug}`)
      }
    } catch (error) {
      console.error('Failed to create product:', error)
    }
  }

  console.log("errors: ", errors)

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
          {I18n.t('products.accessory.new.title')}
        </h2>

        {/*<FormErrors errors={errors} />*/}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
            <div className="block pt-0 space-y-3 md:col-span-2">
              <div>
                <Label htmlFor="category">
                  {I18n.t('products.accessory.form.category')}
                </Label>
                <Select
                  id="category"
                  placeholder={I18n.t('products.accessory.form.select_category')}
                  options={ACCESSORY_CATEGORIES}
                  value={ACCESSORY_CATEGORIES.find(c => c.value === watch('category'))}
                  onChange={(option) => setValue('category', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                />
              </div>

              <div>
                <Label htmlFor="title">
                  {I18n.t('products.accessory.form.title')}
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {I18n.t('products.accessory.form.description')}
                </Label>

                <SimpleEditor
                  // value={watch('description')}
                  onChange={(value) => { 
                    // debugger
                    // setValue('description', value)
                  }}
                  scope="product"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="brand">
                    {I18n.t('products.accessory.form.brand')}
                  </Label>
                  <Input
                    id="brand"
                    {...register('brand')}
                  />
                </div>

                <div>
                  <Label htmlFor="model">
                    {I18n.t('products.accessory.form.model')}
                  </Label>
                  <Input
                    id="model"
                    {...register('model')}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
              <PricingSection register={register} watch={watch} showLimitedEdition />
              <PhotosSection register={register} setValue={setValue} watch={watch} />
              <ShippingSection register={register} watch={watch} />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? I18n.t('products.accessory.form.submitting')
                  : I18n.t('products.accessory.form.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
