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

const GEAR_CATEGORIES = [
  { value: 'instrument', label: 'Instrument' },
  { value: 'audio_gear', label: 'Audio Gear' },
  { value: 'dj_gear', label: 'DJ Gear' }
]

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
]

export default function GearForm() {
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
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      condition: '',
      title: '',
      description: '',
      accept_barter: false,
      barter_description: '',
      photos: []
    }
  })

  const onSubmit = async (data) => {
    try {
      const response = await post(`/${currentUser.username}/products/gear`, {
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
          {I18n.t('products.gear.new.title')}
        </h2>

        <FormErrors errors={errors} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
            <div className="block pt-0 space-y-3 md:col-span-2">
              <div>
                <Label htmlFor="category">
                  {I18n.t('products.gear.form.category')}
                </Label>
                <Select
                  id="category"
                  placeholder={I18n.t('products.gear.form.select_category')}
                  options={GEAR_CATEGORIES}
                  value={GEAR_CATEGORIES.find(c => c.value === watch('category'))}
                  onChange={(option) => setValue('category', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="brand">
                    {I18n.t('products.gear.form.brand')}
                  </Label>
                  <Input
                    id="brand"
                    {...register('brand', { required: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="model">
                    {I18n.t('products.gear.form.model')}
                  </Label>
                  <Input
                    id="model"
                    {...register('model', { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="year">
                    {I18n.t('products.gear.form.year')}
                  </Label>
                  <Input
                    type="number"
                    id="year"
                    min="1900"
                    max={new Date().getFullYear()}
                    {...register('year', {
                      required: true,
                      min: 1900,
                      max: new Date().getFullYear()
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="condition">
                    {I18n.t('products.gear.form.condition')}
                  </Label>
                <Select
                  id="condition"
                  placeholder={I18n.t('products.gear.form.select_condition')}
                  options={CONDITIONS}
                  value={CONDITIONS.find(c => c.value === watch('condition'))}
                  onChange={(option) => setValue('condition', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                />
                </div>
              </div>

              <div>
                <Label htmlFor="title">
                  {I18n.t('products.gear.form.title')}
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {I18n.t('products.gear.form.description')}
                </Label>
                <SimpleEditor
                  value={watch('description')}
                  onChange={(value) => setValue('description', value)}
                  scope="product"
                />
              </div>
            </div>

            <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
              <PricingSection register={register} watch={watch} />
              <PhotosSection register={register} setValue={setValue} watch={watch} />
              <ShippingSection register={register} watch={watch} />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? I18n.t('products.gear.form.submitting')
                  : I18n.t('products.gear.form.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
