import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "react-router-dom"

export default function ProfileForm() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    axios.get(`/${username}/settings.json`).then((res) => {
      setUser(res.data.user)
    })
  }, [username])

  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: user?.username || "",
      hide_username_from_profile: user?.hide_username_from_profile || false,
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      country: user?.country || "",
      city: user?.city || "",
      bio: user?.bio || "",
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await axios.patch(`/${username}/settings/profile`, {
        user: data,
      })
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            This information will be displayed publicly so be careful what you share.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex rounded-md">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                rauversion
              </span>
              <Input
                {...register("username")}
                className="rounded-l-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide_username"
                {...register("hide_username_from_profile")}
              />
              <Label htmlFor="hide_username" className="text-sm font-normal">
                Hide username from profile
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input {...register("first_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input {...register("last_name")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input {...register("country")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input {...register("city")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              {...register("bio")}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Write a few sentences about yourself.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
