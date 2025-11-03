import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { get } from '@rails/request.js'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Download, Edit, Music, FileText, MapPin, Mail } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared'

interface PressKit {
  id: number
  bio: string
  press_release: string
  technical_rider: string
  stage_plot: string
  booking_info: string
  published: boolean
  settings: {
    video_urls?: string[]
    featured_track_ids?: number[]
    featured_playlist_ids?: number[]
  }
  photos: Array<{
    id: number
    url: string
    filename: string
    content_type: string
    byte_size: number
  }>
  documents: Array<{
    id: number
    url: string
    filename: string
    content_type: string
    byte_size: number
  }>
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    bio: string
    avatar_url: string
  }
  featured_tracks?: any[]
  featured_playlists?: any[]
}

export default function PressKitShow() {
  const { username } = useParams<{ username: string }>()
  const [pressKit, setPressKit] = useState<PressKit | null>(null)
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuthStore()
  const { toast } = useToast()

  const canEdit = currentUser && (currentUser.username === username || currentUser.role === 'admin')

  useEffect(() => {
    loadPressKit()
  }, [username])

  const loadPressKit = async () => {
    try {
      setLoading(true)
      const response = await get(`/${username}/presskit.json`)
      
      if (response.ok) {
        const data = await response.json
        setPressKit(data)
      } else {
        const error = await response.json
        toast({
          title: 'Error',
          description: error.error || 'Failed to load press kit',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading press kit:', error)
      toast({
        title: 'Error',
        description: 'Failed to load press kit',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!pressKit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No press kit available</p>
            {canEdit && (
              <div className="mt-4 text-center">
                <Link to={`/${username}/presskit/edit`}>
                  <Button>Create Press Kit</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{pressKit.user.username} - Press Kit</h1>
            <p className="text-muted-foreground">
              {pressKit.user.first_name} {pressKit.user.last_name}
            </p>
          </div>
          {canEdit && (
            <Link to={`/${username}/presskit/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Bio Section */}
      {pressKit.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{pressKit.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Photos Gallery */}
      {pressKit.photos && pressKit.photos.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Press Photos</CardTitle>
            <CardDescription>High-resolution images for press and promotional use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pressKit.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <a
                    href={photo.url}
                    download
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                  >
                    <Download className="h-8 w-8 text-white" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Press Release */}
      {pressKit.press_release && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              <FileText className="inline mr-2 h-5 w-5" />
              Press Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{pressKit.press_release}</p>
          </CardContent>
        </Card>
      )}

      {/* Video Links */}
      {pressKit.settings.video_urls && pressKit.settings.video_urls.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Video Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pressKit.settings.video_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  {url}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Information */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {pressKit.technical_rider && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Music className="inline mr-2 h-5 w-5" />
                Technical Rider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{pressKit.technical_rider}</p>
            </CardContent>
          </Card>
        )}

        {pressKit.stage_plot && (
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="inline mr-2 h-5 w-5" />
                Stage Plot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{pressKit.stage_plot}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking Information */}
      {pressKit.booking_info && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              <Mail className="inline mr-2 h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{pressKit.booking_info}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {pressKit.documents && pressKit.documents.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Additional press materials and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pressKit.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  download
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    <span>{doc.filename}</span>
                  </div>
                  <Download className="h-4 w-4" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
