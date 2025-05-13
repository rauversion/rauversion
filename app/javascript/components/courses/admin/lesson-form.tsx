"use client"
import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import SimpleEditor from "@/components/ui/SimpleEditor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, Video } from "lucide-react"
import { DirectUpload } from "@rails/activestorage"
import CourseDocumentUploader from "@/components/courses/admin/CourseDocumentUploader"
import { useForm } from "react-hook-form"

export default function LessonForm({ lesson = {}, onSubmit, documents = [], onDocumentCreate, onDocumentDelete }) {
  const [videoPreview, setVideoPreview] = useState(lesson.video_url || null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoSignedId, setVideoSignedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documentPreview, setDocumentPreview] = useState(null)
  const [activeTab, setActiveTab] = useState("details")

  const form = useForm({
    defaultValues: {
      title: lesson.title || "",
      description: lesson.description || "",
      type: lesson.type || "video",
      duration: lesson.duration || "",
    }
  })

  const handleVideoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoPreview(URL.createObjectURL(file))
      setVideoFile(file)
      setVideoSignedId(null)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (data) => {
    if (uploading) return
    let signedId = videoSignedId
    if (videoFile && !videoSignedId) {
      setUploading(true)
      const upload = new DirectUpload(videoFile, "/api/v1/direct_uploads")
      upload.create((error, blob) => {
        setUploading(false)
        if (error) {
          alert("Error uploading video: " + error)
        } else {
          signedId = blob.signed_id
          setVideoSignedId(blob.signed_id)
          // After upload, submit the form
          const completeData = {
            ...data,
            video: blob.signed_id,
            videoFile: videoPreview ? { name: "video-file.mp4" } : null,
            documentFile: documentPreview ? { name: documentPreview } : null,
          }
          onSubmit(completeData)
        }
      })
      return
    }
    // If no upload needed, submit immediately
    const completeData = {
      ...data,
      documentFile: documentPreview ? { name: documentPreview } : null,
    }
    onSubmit(completeData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <Tabs defaultValue="details" onValueChange={setActiveTab}>
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
            <FormLabel>Video Upload</FormLabel>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              {videoPreview ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-md overflow-hidden">
                    <video src={videoPreview} controls className="w-full h-full" />
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm">Uploading...</span>
                      <svg className="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium truncate">Video selected</p>
                    <Button variant="destructive" size="sm" onClick={() => { setVideoPreview(null); setVideoFile(null); setVideoSignedId(null) }}>
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <Video className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload lesson video</p>
                  <p className="text-xs text-muted-foreground mb-4">MP4, MOV or WebM formats</p>
                  <Button variant="outline" className="relative">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="video/*"
                      onChange={handleVideoUpload}
                    />
                  </Button>
                </div>
              )}
            </div>
          </div>
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
                Uploading...
              </>
            ) : lesson.id ? "Update Lesson" : "Add Lesson"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
