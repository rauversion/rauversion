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
import { Checkbox } from "@/components/ui/checkbox"
import FormErrors from '../shared/FormErrors'
import PricingSection from '../shared/PricingSection'
import ShippingSection from '../shared/ShippingSection'
import PhotosSection from '../shared/PhotosSection'
import useAuthStore from '@/stores/authStore'
import I18n from '@/stores/locales'
import { get, post } from '@rails/request.js'

const MUSIC_FORMATS = [
  { value: 'vinyl', label: I18n.t('music.index.format.vinyl') },
  { value: 'cassette', label: I18n.t('music.index.format.cassette') },
  { value: 'cd', label: I18n.t('music.index.format.cd') }
]

export default function MusicForm() {
  const { currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useThemeStore()
  const [albums, setAlbums] = React.useState([])
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      category: '',
      playlist_id: '',
      title: '',
      description: '',
      include_digital_album: false,
      photos: []
    }
  })

  React.useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await get(`/${currentUser.username}/albums.json`)
        if (response.ok) {
          const data = await response.json
          setAlbums(data.collection)
        }
      } catch (error) {
        console.error('Error fetching albums:', error)
      }
    }

    fetchAlbums()
  }, [currentUser.username])

  const onSubmit = async (data) => {
    try {
      const response = await post(`/${currentUser.username}/products/music`, {
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
          {I18n.t('products.music.new.title')}
        </h2>

        <FormErrors errors={errors} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-5 gap-4 grid-cols-1">
            <div className="block pt-0 space-y-3 md:col-span-2">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="category">
                    {I18n.t('products.music.form.format')}
                  </Label>
                  <Select
                    id="category"
                    placeholder={I18n.t('products.music.form.select_format')}
                    options={MUSIC_FORMATS}
                    value={MUSIC_FORMATS.find(f => f.value === watch('category'))}
                    onChange={(option) => setValue('category', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="playlist_id">
                    {I18n.t('products.music.form.album')}
                  </Label>
                  <Select
                    id="playlist_id"
                    placeholder={I18n.t('products.music.form.select_album')}
                    options={albums.map(album => ({
                      value: album.id,
                      label: album.title
                    }))}
                    value={albums
                      .map(album => ({
                        value: album.id,
                        label: album.title
                      }))
                      .find(a => a.value === watch('playlist_id'))}
                    onChange={(option) => setValue('playlist_id', option?.value)}
                  theme={(theme) => selectTheme(theme, isDarkMode)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">
                  {I18n.t('products.music.form.title')}
                </Label>
                <Input
                  id="title"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {I18n.t('products.music.form.description')}
                </Label>
                <SimpleEditor
                  value={watch('description')}
                  onChange={(value) => setValue('description', value)}
                  scope="product"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_digital_album"
                  {...register('include_digital_album')}
                />
                <Label htmlFor="include_digital_album">
                  {I18n.t('products.music.form.include_digital')}
                </Label>
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
                  ? I18n.t('products.music.form.submitting')
                  : I18n.t('products.music.form.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
