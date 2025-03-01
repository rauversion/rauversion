import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { ImageUploader } from "@/components/ui/image-uploader"
import { Separator } from "@/components/ui/separator"
import I18n from 'stores/locales'

export default function ProfileForm() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)
  const [avatarBlobId, setAvatarBlobId] = React.useState(null)
  const [headerBlobId, setHeaderBlobId] = React.useState(null)

  const { register, handleSubmit, reset, getValues } = useForm()

  const fetchUser = async () => {
    const response = await get(`/${username}/settings.json`)
    if (response.ok) {
      const data = await response.json
      setUser(data.user)
      setAvatarBlobId(data.user.avatar_blob_id)
      setHeaderBlobId(data.user.profile_header_blob_id)
      
      // Reset form with user data
      reset({
        username: data.user.username,
        hide_username_from_profile: data.user.hide_username_from_profile,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        bio: data.user.bio,
        country: data.user.country,
        city: data.user.city,
      })
    }
  }

  React.useEffect(() => {
    fetchUser()
  }, [username, reset])

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/profile.json`, {
        body: JSON.stringify({ 
          user: {
            ...data
          } 
        }),
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: I18n.t('user_settings.profile.messages.success'),
        })
        // Reset blob IDs after successful update
        setAvatarBlobId(null)
        setHeaderBlobId(null)
        fetchUser()
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || I18n.t('user_settings.profile.messages.error'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: I18n.t('user_settings.profile.messages.error'),
        variant: "destructive",
      })
    }
  }

  const handleAvatarUpload = async (signedBlobId) => {
    setAvatarBlobId(signedBlobId)
    await onSubmit({
      avatar: signedBlobId
    })
  }

  const handleHeaderUpload = async (signedBlobId, cropData) => {
    setHeaderBlobId(signedBlobId)
    const currentValues = getValues()
    await onSubmit({
      ...currentValues,
      profile_header: signedBlobId,
      crop_data: cropData ? JSON.stringify(cropData) : null
    })
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{I18n.t('user_settings.profile.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {I18n.t('user_settings.profile.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">{I18n.t('user_settings.profile.form.username.label')}</Label>
            <div className="flex rounded-md">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                {I18n.t('user_settings.profile.form.username.prefix')}
              </span>
              <Input
                id="username"
                {...register("username")}
                className="rounded-l-none"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="hide_username"
                {...register("hide_username_from_profile")}
              />
              <Label 
                htmlFor="hide_username" 
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {I18n.t('user_settings.profile.form.username.hide')}
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{I18n.t('user_settings.profile.form.name.first')}</Label>
              <Input
                id="first_name"
                {...register("first_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{I18n.t('user_settings.profile.form.name.last')}</Label>
              <Input
                id="last_name"
                {...register("last_name")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{I18n.t('user_settings.profile.form.bio.label')}</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              {I18n.t('user_settings.profile.form.bio.help')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{I18n.t('user_settings.profile.form.location.country')}</Label>
              <Input
                id="country"
                {...register("country")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{I18n.t('user_settings.profile.form.location.city')}</Label>
              <Input
                id="city"
                {...register("city")}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">{I18n.t('user_settings.profile.form.images.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {I18n.t('user_settings.profile.form.images.subtitle')}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>{I18n.t('user_settings.profile.form.images.avatar.label')}</Label>
   
                <ImageUploader
                  aspectRatio={16/9}
                  maxSize={10}
                  preview={true}
                  variant="avatar"
                  imageUrl={user.avatar_url?.medium}
                  onUploadComplete={handleAvatarUpload}
                  className="w-1/4 mx-auto"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {I18n.t('user_settings.profile.form.images.avatar.help')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{I18n.t('user_settings.profile.form.images.header.label')}</Label>
     
                <ImageUploader
                  variant="header"
                  aspectRatio={16/9}
                  maxSize={10}
                  preview={true}
                  enableCropper={true}
                  imageUrl={user.profile_header_url?.medium}
                  onUploadComplete={handleHeaderUpload}
                  className="w-full aspect-[3/1]"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {I18n.t('user_settings.profile.form.images.header.help')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">{I18n.t('save')}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
