import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import { ImageUploader } from "@/components/ui/image-uploader"
import I18n from '@/stores/locales'

export default function PhotosSection({ register, setValue, watch }) {
  const photos = watch('photos') || []

  const handleUploadComplete = (signedId) => {
    setValue('photos', [...photos, { signed_id: signedId }])
  }

  const removePhoto = (index) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    setValue('photos', newPhotos)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{I18n.t('products.form.photos.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={`/rails/active_storage/blobs/redirect/${photo.signed_id}/photo.jpg`}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <ImageUploader
          onUploadComplete={handleUploadComplete}
          aspectRatio={1}
          maxSize={5}
          className="mt-4"
        />
      </CardContent>
    </Card>
  )
}
