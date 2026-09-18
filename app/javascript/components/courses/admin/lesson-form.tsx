"use client"
import React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import SimpleEditor from "@/components/ui/SimpleEditor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, Video } from "lucide-react"
import { DirectUpload } from "@rails/activestorage"
import CourseDocumentUploader from "@/components/courses/admin/CourseDocumentUploader"
import YouTubePlayer from "@/components/courses/YouTubePlayer"
import { youtubeEmbedUrl } from "@/lib/youtube"
import { useForm } from "react-hook-form"

export default function LessonForm({ lesson = {}, onSubmit, documents = [], onDocumentCreate, onDocumentDelete }) {
  const [videoPreview, setVideoPreview] = useState(lesson.video_url || null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoSignedId, setVideoSignedId] = useState<string | null>(null)
  const [videoSource, setVideoSource] = useState(lesson.youtube_url ? "youtube" : "upload")
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  const form = useForm({
    defaultValues: {
      title: lesson.title || "",
      description: lesson.description || "",
      type: lesson.type || "video",
      duration: lesson.duration || "",
      youtube_url: lesson.youtube_url || "",
    }
  })

  const youtubeUrl = form.watch("youtube_url")

  useEffect(() => {
    return () => {
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview)
    }
  }, [videoPreview])

  const handleVideoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoPreview(URL.createObjectURL(file))
      setVideoFile(file)
      setVideoSignedId(null)
    }
  }

  const handleSubmit = async (data) => {
    if (uploading) return
    form.clearErrors("root")
    if (videoSource === "youtube" && !youtubeEmbedUrl(data.youtube_url)) {
      form.setError("youtube_url", { message: I18n.t("courses.lesson_form.youtube_url_invalid") })
      setActiveTab("video")
      return
    }

    try {
      const completeData = { ...data, youtube_url: videoSource === "youtube" ? data.youtube_url.trim() : "" }
      if (videoSource === "upload") {
        let signedId = videoSignedId
        if (videoFile && !signedId) {
          setUploading(true)
          signedId = await new Promise<string>((resolve, reject) => {
            const upload = new DirectUpload(videoFile, "/api/v1/direct_uploads")
            upload.create((error, blob) => error ? reject(error) : resolve(blob.signed_id))
          })
          setVideoSignedId(signedId)
          setUploading(false)
        }
        if (signedId) completeData.video = signedId
      }
      await onSubmit(completeData)
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : I18n.t("courses.lesson_form.save_error") })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, (errors) => setActiveTab(errors.youtube_url ? "video" : "details"))} className="space-y-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{I18n.t("courses.lesson_form.lesson_details")}</TabsTrigger>
            <TabsTrigger value="video">{I18n.t("courses.lesson_form.video")}</TabsTrigger>
            <TabsTrigger value="resources">{I18n.t("courses.lesson_form.resources")}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: I18n.t("courses.lesson_form.title_required") }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t("courses.lesson_form.lesson_title")}</FormLabel>
                  <FormControl>
                    <Input
                      id="title"
                      placeholder={I18n.t("courses.lesson_form.lesson_title_placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{I18n.t("courses.lesson_form.description_optional")}</FormLabel>
                  <FormControl>
                    <SimpleEditor
                      value={field.value}
                      onChange={field.onChange}
                      scope="product"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("courses.lesson_form.lesson_type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="type">
                          <SelectValue placeholder={I18n.t("courses.lesson_form.select_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="video">{I18n.t("courses.lesson_form.type_video")}</SelectItem>
                        <SelectItem value="practice">{I18n.t("courses.lesson_form.type_practice")}</SelectItem>
                        <SelectItem value="quiz">{I18n.t("courses.lesson_form.type_quiz")}</SelectItem>
                        <SelectItem value="reading">{I18n.t("courses.lesson_form.type_reading")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                rules={{ required: I18n.t("courses.lesson_form.duration_required") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("courses.lesson_form.duration")}</FormLabel>
                    <FormControl>
                      <Input
                        id="duration"
                        placeholder={I18n.t("courses.lesson_form.duration_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

        <TabsContent value="video" className="space-y-4 pt-4">
          <div className="space-y-2">
            <FormLabel htmlFor="video-source">{I18n.t("courses.lesson_form.video_source")}</FormLabel>
            <Select value={videoSource} disabled={form.formState.isSubmitting} onValueChange={(value) => {
              setVideoSource(value)
              form.clearErrors("youtube_url")
            }}>
              <SelectTrigger id="video-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload">{I18n.t("courses.lesson_form.upload_video")}</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {videoSource === "youtube" ? (
            <>
              <FormField
                control={form.control}
                name="youtube_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{I18n.t("courses.lesson_form.youtube_url")}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormDescription>{I18n.t("courses.lesson_form.youtube_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {youtubeEmbedUrl(youtubeUrl) && (
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                  <YouTubePlayer url={youtubeUrl} title={form.watch("title")} />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <FormLabel>{I18n.t("courses.lesson_form.upload_video")}</FormLabel>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                {videoPreview ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-md overflow-hidden">
                      <video src={videoPreview} controls className="w-full h-full" />
                    </div>
                    {uploading && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm">{I18n.t("courses.lesson_form.uploading")}</span>
                        <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium truncate">{I18n.t("courses.lesson_form.video_selected")}</p>
                      <Button type="button" disabled={form.formState.isSubmitting} variant="destructive" size="sm" onClick={() => { setVideoPreview(null); setVideoFile(null); setVideoSignedId(null) }}>
                        <X className="h-4 w-4 mr-2" />
                        {I18n.t("courses.lesson_form.remove_video")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <Video className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">{I18n.t("courses.lesson_form.upload_video")}</p>
                    <p className="text-xs text-muted-foreground mb-4">{I18n.t("courses.lesson_form.video_formats")}</p>
                    <Button type="button" disabled={form.formState.isSubmitting} variant="outline" className="relative">
                      <Upload className="h-4 w-4 mr-2" />
                      {I18n.t("courses.lesson_form.upload_video")}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="video/*"
                        disabled={form.formState.isSubmitting}
                        onChange={handleVideoUpload}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 pt-4">
          <div className="space-y-2">
            <FormLabel>Additional Resources</FormLabel>
            <CourseDocumentUploader
              documents={documents}
              onDocumentCreate={onDocumentCreate}
              onDocumentDelete={onDocumentDelete}
            />
          </div>
        </TabsContent>
      </Tabs>


        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={uploading || form.formState.isSubmitting}>
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                {I18n.t("courses.lesson_form.uploading")}
              </>
            ) : lesson.id ? "Update Lesson" : "Add Lesson"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
