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
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
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

  const category = watch('category')

  const onSubmit = async (data) => {
    try {
      const response = await post(`/${currentUser.username}/products/service`, {
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
          {I18n.t('products.service.new.title')}
        </h2>

        <FormErrors errors={errors} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
            <div className="block pt-0 space-y-3 md:col-span-2">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="category">
                    {I18n.t('products.service.form.category')}
                  </Label>
                  <Select
                    id="category"
                    placeholder={I18n.t('products.service.form.select_category')}
                    options={SERVICE_TYPES}
                    value={SERVICE_TYPES.find(t => t.value === watch('category'))}
                    onChange={(option) => setValue('category', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="delivery_method">
                    {I18n.t('products.service.form.delivery_method')}
                  </Label>
                  <Select
                    id="delivery_method"
                    placeholder={I18n.t('products.service.form.select_delivery_method')}
                    options={DELIVERY_METHODS}
                    value={DELIVERY_METHODS.find(m => m.value === watch('delivery_method'))}
                    onChange={(option) => setValue('delivery_method', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">
                  {I18n.t('products.service.form.title')}
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {I18n.t('products.service.form.description')}
                </Label>
                <SimpleEditor
                  value={watch('description')}
                  onChange={(value) => setValue('description', value)}
                  scope="product"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="duration_minutes">
                    {I18n.t('products.service.form.duration')}
                  </Label>
                  <Input
                    type="number"
                    id="duration_minutes"
                    min="15"
                    step="15"
                    {...register('duration_minutes', {
                      required: true,
                      min: 15
                    })}
                  />
                </div>

                {category === 'classes' && (
                  <div>
                    <Label htmlFor="max_participants">
                      {I18n.t('products.service.form.max_participants')}
                    </Label>
                    <Input
                      type="number"
                      id="max_participants"
                      min="1"
                      {...register('max_participants', {
                        required: category === 'classes',
                        min: 1
                      })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col flex-grow md:col-span-3 col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{I18n.t('products.service.form.details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prerequisites">
                      {I18n.t('products.service.form.prerequisites')}
                    </Label>
                    <SimpleEditor
                      value={watch('prerequisites')}
                      onChange={(value) => setValue('prerequisites', value)}
                      scope="product"
                      plain
                    />
                  </div>

                  <div>
                    <Label htmlFor="what_to_expect">
                      {I18n.t('products.service.form.what_to_expect')}
                    </Label>
                    <SimpleEditor
                      value={watch('what_to_expect')}
                      onChange={(value) => setValue('what_to_expect', value)}
                      scope="product"
                      plain
                    />
                  </div>

                  <div>
                    <Label htmlFor="cancellation_policy">
                      {I18n.t('products.service.form.cancellation_policy')}
                    </Label>
                    <SimpleEditor
                      value={watch('cancellation_policy')}
                      onChange={(value) => setValue('cancellation_policy', value)}
                      scope="product"
                      plain
                    />
                  </div>
                </CardContent>
              </Card>

              <PricingSection register={register} watch={watch} />
              <PhotosSection register={register} setValue={setValue} watch={watch} />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? I18n.t('products.service.form.submitting')
                  : I18n.t('products.service.form.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
