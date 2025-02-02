import React from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { get, put } from "@rails/request.js"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function EmailSettings() {
  const { username } = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      email: "",
    },
  })

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await get(`/${username}/settings.json`)
        if (response.ok) {
          const data = await response.json
          reset({
            email: data.user.email
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Could not load email settings.",
          variant: "destructive",
        })
      }
    }
    fetchUser()
  }, [username, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await put(`/${username}/settings/email`, {
        body: JSON.stringify({ user: data }),
        responseKind: "json"
      })
      
      if (response.ok) {
        toast({
          description: "Your email has been updated successfully.",
        })
      } else {
        const error = await response.json
        toast({
          title: "Error",
          description: error.message || "There was a problem updating your email.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem updating your email.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your email address. You'll need to verify any new email address.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              placeholder="Enter your email"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Email"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
