import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import { ImageUploader } from "@/components/ui/image-uploader"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import I18n from '@/stores/locales'

export default function PhotosSection({ control }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{I18n.t('products.form.photos.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="product_images_attributes"
          rules={{
            validate: {
              atLeastOne: (value) => 
                (value && value.some(img => !img._destroy)) || "At least one photo is required"
            }
          }}
          render={({ field }) => {
            const images = field.value || []
            const activeImages = images.filter(img => !img._destroy)

            const handleUploadComplete = (signedId) => {
              const newImage = {
                image: signedId,
                name: '',
                description: ''
              }
              field.onChange([...images, newImage])
            }

            const removeImage = (index) => {
              const newImages = [...images]
              if (newImages[index].id) {
                newImages[index] = { ...newImages[index], _destroy: true }
              } else {
                newImages.splice(index, 1)
              }
              field.onChange(newImages)
            }

            const updateImageField = (index, fieldName, value) => {
              const newImages = [...images]
              newImages[index] = { ...newImages[index], [fieldName]: value }
              field.onChange(newImages)
            }

            return (
              <FormItem>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeImages.map((image, index) => (
                      <div key={index} className="relative group space-y-2">
                        <div className="relative">
                          <img
                            src={image.id ? 
                              `/rails/active_storage/blobs/redirect/${image.image}/photo.jpg` :
                              `/rails/active_storage/blobs/redirect/${image.image}/photo.jpg`
                            }
                            alt={image.name || `Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Image name"
                          value={image.name || ''}
                          onChange={(e) => updateImageField(index, 'name', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Image description"
                          value={image.description || ''}
                          onChange={(e) => updateImageField(index, 'description', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <FormControl>
                    <ImageUploader
                      onUploadComplete={handleUploadComplete}
                      aspectRatio={1}
                      maxSize={5}
                      className="mt-4"
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )
          }}
        />
      </CardContent>
    </Card>
  )
}
