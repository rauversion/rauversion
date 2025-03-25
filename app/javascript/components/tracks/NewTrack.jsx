import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { InterestAlert } from "../shared/alerts"
import useAuthStore from '@/stores/authStore'
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
import { Share2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import selectTheme from "@/components/ui/selectTheme"
import I18n from 'stores/locales'

import "@/styles/react-select.css"

export default function NewTrack() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isDarkMode } = useThemeStore()
  const { currentUser } = useAuthStore()
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
        title: I18n.t('tracks.new.messages.invalid_files'),
        description: I18n.t('tracks.new.messages.audio_only'),
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
        title: I18n.t('tracks.new.messages.no_files'),
        description: I18n.t('tracks.new.messages.select_files'),
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
        description: I18n.t('tracks.new.messages.upload_success', {
          count: files.length,
          plural: files.length > 1 ? 's' : ''
        }),
        variant: "success",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: I18n.t('tracks.new.messages.upload_error'),
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
        description: I18n.t('tracks.new.messages.cover_error'),
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
        description: I18n.t('tracks.new.messages.save_error'),
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
                    <Label htmlFor={`title-${index}`}>{I18n.t('tracks.new.form.title')}</Label>
                    <Input
                      id={`title-${index}`}
                      value={file.title}
                      onChange={(e) => updateTrackInfo(index, 'title', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`tags-${index}`}>{I18n.t('tracks.new.form.tags')}</Label>
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
                      placeholder={I18n.t('tracks.new.form.tags_placeholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>{I18n.t('tracks.new.form.description')}</Label>
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
                      {I18n.t('tracks.new.form.private_track')}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6">
            <Button type="submit" className="w-full">
              {I18n.t('tracks.new.form.save')}
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
            <Card key={track.id} className="overflow-hidden">
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
                        {I18n.t('tracks.private')}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>{I18n.t('tracks.new.share.upload_complete')}</p>
                        <Link
                          to={`/tracks/${track.slug}`}
                          className="text-primary hover:text-primary/90"
                        >
                          {I18n.t('tracks.new.share.go_to_track')}
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
                          {I18n.t('tracks.new.share.share')}
                        </h4>
                        
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/tracks/${track.id}`)
                              toast({
                                description: I18n.t('tracks.new.messages.link_copied'),
                              })
                            }}
                          >
                            {I18n.t('tracks.new.share.copy_link')}
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
                              {I18n.t('tracks.new.share.share_twitter')}
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

  const handleArtistInterest = async () => {
    try {
      const response = await post('/api/artist_requests', {
        responseKind: 'json',
        body: JSON.stringify({
          artist_request: {
            status: 'pending'
          }
        })
      });

      const data = await response.json;
      
      if (data.success) {
        toast({
          title: "Success!",
          description: "Your interest in becoming an artist has been submitted. We'll review your request shortly.",
        });
      } else {
        toast({
          title: "Error",
          description: "There was a problem submitting your request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!currentUser?.is_creator) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InterestAlert 
          type="artist"
          onSubmit={handleArtistInterest}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="uploader flex justify-center my-10">
        <div className="flex-col max-w-2xl w-full">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-default">
              {I18n.t('tracks.new.upload.title')}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {I18n.t('tracks.new.upload.subtitle')}
            </p>
          </div>

          <div
            onDragEnter={(e) => e.preventDefault()}
            onDragLeave={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mt-8 flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-muted hover:border-muted-foreground transition-colors cursor-pointer"
          >
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            
            <Label
              htmlFor="audio-upload"
              className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer"
            >
              {I18n.t('tracks.new.upload.button')}
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">{I18n.t('tracks.new.upload.or_drop')}</p>
            
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
              {I18n.t('tracks.new.upload.size_limit')}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8 max-w-3xl mx-auto space-y-4">
          {files.map((file, index) => (
            <Card key={file.name} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setFiles(files.filter((_, i) => i !== index))
                          setUploadProgress(prev => {
                            const newProgress = { ...prev }
                            delete newProgress[file.name]
                            return newProgress
                          })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2 space-y-1">
                      <Progress
                        value={uploadProgress[file.name] || 0}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {uploadProgress[file.name]
                            ? `${Math.round(uploadProgress[file.name])}%`
                            : I18n.t('tracks.new.controls.waiting')}
                        </span>
                        {uploadProgress[file.name] === 100 && (
                          <span className="text-primary">{I18n.t('tracks.new.controls.complete')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Privacy and Playlist Controls */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {files.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="make-playlist"
                    checked={makePlaylist}
                    onCheckedChange={setMakePlaylist}
                  />
                  <Label htmlFor="make-playlist">
                    {I18n.t('tracks.new.controls.create_playlist')}
                  </Label>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">{I18n.t('tracks.new.controls.privacy')}</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroup
                      value={privacy}
                      onValueChange={setPrivacy}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">{I18n.t('tracks.new.controls.public')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">{I18n.t('tracks.new.controls.private')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFiles([])
                setUploadProgress({})
              }}
            >
              {I18n.t('tracks.new.controls.clear_all')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading ? I18n.t('tracks.new.controls.uploading') : I18n.t('tracks.new.controls.start_upload')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
