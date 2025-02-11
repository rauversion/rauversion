import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import FormErrors from '../shared/FormErrors'
import PricingSection from '../shared/PricingSection'
import ShippingSection from '../shared/ShippingSection'
import PhotosSection from '../shared/PhotosSection'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { post } from '@rails/request.js'

export default function MerchForm() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      category: 'merch',
      title: '',
      description: '',
      brand: '',
      model: '',
      limited_edition: false,
      limited_edition_count: '',
      photos: []
    }
  })

  const limitedEdition = watch('limited_edition')

  const onSubmit = async (data) => {
    try {
      const response = await post(`/${currentUser.username}/products/merch`, {
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
          {I18n.t('products.merch.new.title')}
        </h2>

        <FormErrors errors={errors} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
            <div className="block pt-0 space-y-3 md:col-span-2">
              <input type="hidden" {...register('category')} />

              <div>
                <Label htmlFor="title">
                  {I18n.t('products.merch.form.title')}
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {I18n.t('products.merch.form.description')}
                </Label>
                <Textarea
                  id="description"
                  {...register('description', { required: true })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="brand">
                    {I18n.t('products.merch.form.brand')}
                  </Label>
                  <Input
                    id="brand"
                    {...register('brand')}
                  />
                </div>

                <div>
                  <Label htmlFor="model">
                    {I18n.t('products.merch.form.model')}
                  </Label>
                  <Input
                    id="model"
                    {...register('model')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="limited_edition"
                  {...register('limited_edition')}
                />
                <Label htmlFor="limited_edition">
                  {I18n.t('products.merch.form.limited_edition')}
                </Label>
              </div>

              {limitedEdition && (
                <div>
                  <Label htmlFor="limited_edition_count">
                    {I18n.t('products.merch.form.limited_edition_count')}
                  </Label>
                  <Input
                    type="number"
                    id="limited_edition_count"
                    min="1"
                    {...register('limited_edition_count', {
                      required: limitedEdition,
                      min: 1
                    })}
                  />
                </div>
              )}
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
                  ? I18n.t('products.merch.form.submitting')
                  : I18n.t('products.merch.form.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
