import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Music } from "lucide-react"
import { DirectUpload } from "@rails/activestorage"
import { post } from "@rails/request.js"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Select from "react-select"
import { Category } from "@/lib/constants"
import { useThemeStore } from '@/stores/theme'
import { ImageUploader } from "@/components/ui/image-uploader"
import { Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import "@/styles/react-select.css"

const selectTheme = (theme, isDark) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: 'hsl(var(--primary))',
    primary75: 'hsla(var(--primary), 0.75)',
    primary50: 'hsla(var(--primary), 0.5)',
    primary25: 'hsla(var(--primary), 0.25)',
    danger: 'hsl(var(--destructive))',
    dangerLight: 'hsla(var(--destructive), 0.2)',
    neutral0: isDark ? 'hsl(var(--background))' : 'hsl(var(--background))',
    neutral5: isDark ? 'hsl(var(--background))' : 'hsl(var(--muted))',
    neutral10: isDark ? 'hsl(var(--muted))' : 'hsl(var(--muted))',
    neutral20: isDark ? 'hsl(var(--border))' : 'hsl(var(--border))',
    neutral30: isDark ? 'hsl(var(--border))' : 'hsl(var(--border))',
    neutral40: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
    neutral50: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
    neutral60: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
    neutral70: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
    neutral80: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
    neutral90: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
  },
})

export default function NewTrack() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const [step, setStep] = React.useState("upload") // upload or info
  const [uploading, setUploading] = React.useState(false)
  const [files, setFiles] = React.useState([])
  const [uploadProgress, setUploadProgress] = React.useState({})
  const [uploadedFiles, setUploadedFiles] = React.useState([])
  const [makePlaylist, setMakePlaylist] = React.useState(false)
  const [privacy, setPrivacy] = React.useState("public")
  const [completedTracks, setCompletedTracks] = React.useState([])
  const fileInputRef = React.useRef(null)
  const progressContainerRef = React.useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    // Filter for audio files
    const audioFiles = newFiles.filter(file => file.type.startsWith('audio/'))
    if (audioFiles.length !== newFiles.length) {
      toast({
        title: "Invalid files",
        description: "Only audio files are allowed",
        variant: "destructive",
      })
    }
    setFiles(prev => [...prev, ...audioFiles])
  }

  const uploadFile = async (file, type = 'audio') => {
    return new Promise((resolve, reject) => {
      const upload = new DirectUpload(file, '/rails/active_storage/direct_uploads', {
        directUploadWillStoreFileWithXHR: (request) => {
          request.upload.addEventListener('progress', (event) => {
            const progress = (event.loaded / event.total) * 100
            if (type === 'audio') {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: progress
              }))
            }
          })
        }
      })
      
      upload.create((error, blob) => {
        if (error) {
          reject(error)
        } else {
          resolve(blob)
        }
      })
    })
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one audio file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Upload all files
      const uploadPromises = files.map(file => uploadFile(file))
      const blobs = await Promise.all(uploadPromises)

      // Store uploaded files info
      setUploadedFiles(files.map((file, index) => ({
        name: file.name,
        blobId: blobs[index].signed_id,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: "",
        tags: [],
        coverId: null,
        private: false,
      })))

      setStep("info")
      toast({
        description: `Successfully uploaded ${files.length} track${files.length > 1 ? 's' : ''}`,
        variant: "success",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload tracks",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCoverUpload = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const blob = await uploadFile(file, 'image')
      updateTrackInfo(index, 'coverId', blob.signed_id)
    } catch (error) {
      console.error('Cover upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload cover image",
        variant: "destructive",
      })
    }
  }

  const handleSubmitInfo = async (e) => {
    e.preventDefault()
    
    try {
      const response = await post('/tracks', {
        responseKind: 'json',
        body: JSON.stringify({
          track_form: {
            step: "info",
            make_playlist: makePlaylist,
            privacy: privacy,
            tracks_attributes: uploadedFiles.map(file => ({
              audio: file.blobId,
              title: file.title,
              description: file.description,
              tags: file.tags,
              cover: file.coverId,
              private: file.private,
            }))
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json
      
      if (data.success) {
        setCompletedTracks(data.tracks)
        setStep("share")
      } else {
        toast({
          title: "Error",
          description: data.errors.join(", "),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to save track information",
        variant: "destructive",
      })
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[files[index].name]
      return newProgress
    })
  }

  const updateTrackInfo = (index, field, value) => {
    setUploadedFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, [field]: value } : file
    ))
  }

  if (step === "info") {

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmitInfo} className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl space-y-4">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="min-h-full flex justify-center py-6 sm:px-6 lg:px-8 border rounded-md">
              <div className="flex gap-8 w-full max-w-4xl">
                {/* Left side - Cover Image */}
                <div className="w-48 flex flex-col gap-2">
                  <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
                    {file.coverId ? (
                      <img
                        src={`/rails/active_storage/blobs/redirect/${file.coverId}/cover.jpg`}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-background">
                        <Music className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <ImageUploader
                    aspectRatio={1}
                    imageUrl={file.coverId ? `/rails/active_storage/blobs/redirect/${file.coverId}/cover.jpg` : null}
                    onUploadComplete={(signedId) => {
                      updateTrackInfo(index, 'coverId', signedId)
                    }}
                    preview={false}
                  />
                </div>

                {/* Right side - Form Fields */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>Title</Label>
                    <Input
                      id={`title-${index}`}
                      value={file.title}
                      onChange={(e) => updateTrackInfo(index, 'title', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`tags-${index}`}>Tags</Label>
                    <Select
                      id={`tags-${index}`}
                      value={file.tags.map(tag => ({ value: tag, label: tag }))}
                      theme={(theme) => selectTheme(theme, isDarkMode)}
                      onChange={(selected) => 
                        updateTrackInfo(
                          index,
                          'tags',
                          selected ? selected.map(option => option.value) : []
                        )
                      }
                      options={Category.Genres.map(genre => ({
                        value: genre,
                        label: genre
                      }))}
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                      placeholder="Select tags"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={file.description}
                      onChange={(e) => updateTrackInfo(index, 'description', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`private-${index}`}
                      checked={file.private}
                      onCheckedChange={(checked) => updateTrackInfo(index, 'private', checked)}
                    />
                    <Label htmlFor={`private-${index}`}>
                      Private Track
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6">
            <Button type="submit" className="w-full">
              Save All Tracks
            </Button>
          </div>
        </form>
      </div>
    )
  }

  if (step === "share") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {completedTracks.map((track) => (
            <Card key={track.slug} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex">
                  {/* Cover Image */}
                  <div className="mr-4">
                    <div className="relative w-32 h-32">
                      {track.cover_url ? (
                        <img
                          src={track.cover_url}
                          alt={track.title}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                          <Music className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {track.user.username}
                      </p>
                    </div>

                    {track.private && (
                      <Badge variant="secondary" className="mb-2">
                        Private
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Upload complete.</p>
                        <Link
                          to={`/tracks/${track.id}`}
                          className="text-primary hover:text-primary/90"
                        >
                          Go to track
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Share Section */}
                  <div className="pl-4 w-56 border-l">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </h4>
                        
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/tracks/${track.id}`)
                              toast({
                                description: "Link copied to clipboard",
                              })
                            }}
                          >
                            Copy Link
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="w-full justify-start text-sm"
                            asChild
                          >
                            <a
                              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                `${window.location.origin}/tracks/${track.id}`
                              )}&text=${encodeURIComponent(track.title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Share on Twitter
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="uploader flex justify-center my-10">
        <div className="flex-col max-w-2xl w-full">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-default">
              Drag and drop your tracks here
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Provide FLAC, WAV, ALAC, or AIFF for highest audio quality.
            </p>
          </div>

          <form onSubmit={handleUpload} className="mt-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-muted hover:border-muted-foreground transition-colors"
            >
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              
              <Label
                htmlFor="audio-upload"
                className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer"
              >
                Upload audio files
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">or drag and drop</p>
              
              <input
                id="audio-upload"
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Audio files up to 200MB
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-4" ref={progressContainerRef}>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Music className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-default">
                          {file.name}
                        </p>
                        <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${uploadProgress[file.name] || 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {uploadProgress[file.name] && ` • ${Math.round(uploadProgress[file.name])}%`}
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {files.length > 1 && (
              <div className="mt-6 flex items-center space-x-2">
                <Switch
                  id="make-playlist"
                  checked={makePlaylist}
                  onCheckedChange={setMakePlaylist}
                />
                <Label htmlFor="make-playlist">
                  Create a playlist with these tracks
                </Label>
              </div>
            )}

            <div className="mt-6">
              <Label className="text-sm font-medium">Privacy</Label>
              <div className="mt-2 flex items-center space-x-4">
                <Label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={privacy === "public"}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-primary"
                  />
                  <span>Public</span>
                </Label>
                <Label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={privacy === "private"}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-primary"
                  />
                  <span>Private</span>
                </Label>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={files.length === 0 || uploading}
              >
                {uploading ? "Uploading..." : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
