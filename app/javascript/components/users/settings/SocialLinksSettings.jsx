import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, patch } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export default function SocialLinksSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [user, setUser] = React.useState(null)

  const defaultValues = {
    social_title: "",
    social_description: "",
    google_analytics_id: "",
    facebook_pixel_id: "",
    email_sign_up: false,
    sensitive_content: false,
    age_restriction: "all",
  }

  const form = useForm({
    defaultValues,
    mode: "onChange"
  })

  const { control, handleSubmit, reset, setError } = form

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          setUser(data.user)
          
          reset({
            social_title: data.user.social_links_settings.social_title || "",
            social_description: data.user.social_links_settings.social_description || "",
            google_analytics_id: data.user.social_links_settings.google_analytics_id || "",
            facebook_pixel_id: data.user.social_links_settings.facebook_pixel_id || "",
            email_sign_up: Boolean(data.user.social_links_settings.email_sign_up),
            sensitive_content: Boolean(data.user.social_links_settings.sensitive_content),
            age_restriction: data.user.social_links_settings.age_restriction || "all",
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Could not load social links settings.",
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username])

  const onSubmit = async (data) => {
    try {
      const response = await patch(`/${username}/settings/social_links`, {
        body: JSON.stringify({ user: data }),
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          description: "Your social links settings have been updated.",
        })
      } else {
        const error = await response.json
        if (error.errors) {
          // Set errors for each field
          Object.keys(error.errors).forEach((key) => {
            setError(key, {
              type: "manual",
              message: error.errors[key].join(", ")
            })
          })
          
          toast({
            title: "Error",
            description: "Please check the form for errors.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "There was a problem updating your settings.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your settings.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize how your profile appears in search engines.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={control}
                name="social_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your social title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="social_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="A brief description of your page"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Integration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect your analytics accounts to track your profile performance.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={control}
                name="google_analytics_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Analytics ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="facebook_pixel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook Pixel ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XXXXXXXXXXXXXXXXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mailing List Integration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure your mailing list preferences.
            </p>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="email_sign_up"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Email Sign-up</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Let fans sign up to get updates on new content
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your content display preferences.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={control}
              name="sensitive_content"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Display Sensitive Content</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Show content that may be sensitive to some viewers
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="age_restriction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Restriction</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age restriction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="13">13+</SelectItem>
                        <SelectItem value="16">16+</SelectItem>
                        <SelectItem value="18">18+</SelectItem>
                        <SelectItem value="21">21+</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Update Settings</Button>
        </div>
      </form>
    </Form>
  )
}
