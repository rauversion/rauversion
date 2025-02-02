import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"

export default function ProfileForm() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const response = await get(`/${username}/settings.json`)
      if (response.ok) {
        const data = await response.json
        debugger


        setUser(data.user)
      }
    }
    fetchUser()
  }, [username])

  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: user?.username || "",
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
      location: user?.location || "",
      website: user?.website || "",
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/profile`, {
        body: JSON.stringify({ user: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your profile has been updated.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your profile.",
          variant: "destructive",
        })
      }
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
          <CardTitle>Profile Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your profile information and personal details.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...register("username")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...register("first_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...register("last_name")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register("location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              {...register("website")}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
