import React, { useState } from "react"
import { DirectUpload } from "@rails/activestorage"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUploader } from "@/components/ui/image-uploader"
import CourseCover, { CourseCoverData } from "@/components/courses/CourseCover"
import { youtubeEmbedUrl } from "@/lib/youtube"

interface Props {
  course: CourseCoverData
  onChange: (data: Partial<CourseCoverData>) => void
  uploading: boolean
  onUploadingChange: (uploading: boolean) => void
}

export default function CourseCoverEditor({ course, onChange, uploading, onUploadingChange }: Props) {
  const [error, setError] = useState("")
  const coverType = course.cover_type || "image"
  const validYoutubeUrl = youtubeEmbedUrl(course.youtube_url || "")

  const uploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setError("")
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
      setError(I18n.t("courses.cover.invalid_video"))
      return
    }

    onUploadingChange(true)
    try {
      const blob = await new Promise<{ signed_id: string; service_url: string }>((resolve, reject) => {
        new DirectUpload(file, "/api/v1/direct_uploads").create((uploadError, uploadedBlob) => {
          uploadError ? reject(uploadError) : resolve(uploadedBlob)
        })
      })
      onChange({ intro_video: blob.signed_id, intro_video_url: blob.service_url })
    } catch {
      setError(I18n.t("courses.cover.upload_error"))
    } finally {
      onUploadingChange(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="course-cover-type">{I18n.t("courses.cover.title")}</Label>
        <Select value={coverType} disabled={uploading} onValueChange={(value: CourseCoverData["cover_type"]) => {
          setError("")
          onChange({ cover_type: value, ...(value !== "youtube" && !validYoutubeUrl ? { youtube_url: "" } : {}) })
        }}>
          <SelectTrigger id="course-cover-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="image">{I18n.t("courses.cover.image")}</SelectItem>
            <SelectItem value="video">{I18n.t("courses.cover.video")}</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{I18n.t("courses.cover.help")}</p>
      </div>

      {coverType === "youtube" && (
        <div className="space-y-2">
          <Label htmlFor="course-youtube-url">{I18n.t("courses.lesson_form.youtube_url")}</Label>
          <Input
            id="course-youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={course.youtube_url || ""}
            onChange={(event) => onChange({ youtube_url: event.target.value })}
            aria-invalid={!!course.youtube_url && !validYoutubeUrl}
            aria-describedby="course-youtube-help"
          />
          <p id="course-youtube-help" className="text-sm text-muted-foreground">{I18n.t("courses.lesson_form.youtube_help")}</p>
          {course.youtube_url && !validYoutubeUrl && (
            <p role="alert" className="text-sm text-destructive">{I18n.t("courses.lesson_form.youtube_url_invalid")}</p>
          )}
          {validYoutubeUrl && <CourseCover course={course} />}
        </div>
      )}

      {coverType === "video" && (
        <div className="space-y-2" aria-busy={uploading}>
          {course.intro_video_url && <CourseCover course={course} />}
          <Label htmlFor="course-intro-video">{I18n.t("courses.lesson_form.upload_video")}</Label>
          <Input id="course-intro-video" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" disabled={uploading} onChange={uploadVideo} />
          <p className="text-sm text-muted-foreground">{I18n.t("courses.lesson_form.video_formats")}</p>
          {uploading && <p role="status" className="text-sm">{I18n.t("courses.cover.uploading")}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label>{I18n.t("courses.details_form.course_thumbnail")}</Label>
        {coverType !== "image" && <p className="text-sm text-muted-foreground">{I18n.t("courses.cover.thumbnail_help")}</p>}
        <ImageUploader
          imageUrl={course.thumbnail_url}
          onUploadComplete={(signedId, _cropData, serviceUrl) => {
            if (signedId) onChange({ thumbnail: signedId, thumbnail_url: serviceUrl })
          }}
        />
      </div>
    </div>
  )
}
