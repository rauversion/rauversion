import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { get, put } from '@rails/request.js'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared'

interface PressKitFormData {
  bio: string
  press_release: string
  technical_rider: string
  stage_plot: string
  booking_info: string
  published: boolean
  settings: {
    video_urls: string[]
  }
}

export default function PressKitEdit() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<PressKitFormData>({
    bio: '',
    press_release: '',
    technical_rider: '',
    stage_plot: '',
    booking_info: '',
    published: false,
    settings: {
      video_urls: []
    }
  })
  const [videoUrlInput, setVideoUrlInput] = useState('')

  const canEdit = currentUser && (currentUser.username === username || currentUser.role === 'admin')

  useEffect(() => {
    if (!canEdit) {
      navigate(`/${username}/presskit`)
      return
    }
    loadPressKit()
  }, [username, canEdit])

  const loadPressKit = async () => {
    try {
      setLoading(true)
      const response = await get(`/${username}/presskit.json`)
      
      if (response.ok) {
        const data = await response.json
        setFormData({
          bio: data.bio || '',
          press_release: data.press_release || '',
          technical_rider: data.technical_rider || '',
          stage_plot: data.stage_plot || '',
          booking_info: data.booking_info || '',
          published: data.published || false,
          settings: {
            video_urls: data.settings?.video_urls || []
          }
        })
      }
    } catch (error) {
      console.error('Error loading press kit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await put(`/${username}/presskit.json`, {
        body: JSON.stringify({
          press_kit: formData
        }),
        contentType: 'application/json'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Press kit saved successfully'
        })
        navigate(`/${username}/presskit`)
      } else {
        const error = await response.json
        toast({
          title: 'Error',
          description: error.error || 'Failed to save press kit',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving press kit:', error)
      toast({
        title: 'Error',
        description: 'Failed to save press kit',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof PressKitFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addVideoUrl = () => {
    if (videoUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          video_urls: [...prev.settings.video_urls, videoUrlInput.trim()]
        }
      }))
      setVideoUrlInput('')
    }
  }

  const removeVideoUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        video_urls: prev.settings.video_urls.filter((_, i) => i !== index)
      }
    }))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to={`/${username}/presskit`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Press Kit
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Edit Press Kit</h1>
        <p className="text-muted-foreground">
          Manage your professional press kit
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Biography */}
        <Card>
          <CardHeader>
            <CardTitle>Biography</CardTitle>
            <CardDescription>Your artist biography for press and promotional use</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Write your biography here..."
              rows={6}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Press Release */}
        <Card>
          <CardHeader>
            <CardTitle>Press Release</CardTitle>
            <CardDescription>Latest press release or official announcement</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.press_release}
              onChange={(e) => handleChange('press_release', e.target.value)}
              placeholder="Write your press release here..."
              rows={6}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Video URLs */}
        <Card>
          <CardHeader>
            <CardTitle>Video Links</CardTitle>
            <CardDescription>Add links to performance videos, music videos, etc.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1"
              />
              <Button type="button" onClick={addVideoUrl} variant="secondary">
                Add
              </Button>
            </div>
            {formData.settings.video_urls.length > 0 && (
              <div className="space-y-2">
                {formData.settings.video_urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                      {url}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVideoUrl(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Rider</CardTitle>
              <CardDescription>Technical requirements for performances</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.technical_rider}
                onChange={(e) => handleChange('technical_rider', e.target.value)}
                placeholder="Equipment, setup requirements, etc..."
                rows={6}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage Plot</CardTitle>
              <CardDescription>Stage setup and layout information</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.stage_plot}
                onChange={(e) => handleChange('stage_plot', e.target.value)}
                placeholder="Stage layout, positions, etc..."
                rows={6}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Contact information for bookings and inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.booking_info}
              onChange={(e) => handleChange('booking_info', e.target.value)}
              placeholder="Email, phone, agent information, etc..."
              rows={4}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Publish Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>Control whether your press kit is publicly visible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => handleChange('published', checked)}
              />
              <Label htmlFor="published">
                {formData.published ? 'Published (visible to everyone)' : 'Draft (only visible to you)'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link to={`/${username}/presskit`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Press Kit
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
