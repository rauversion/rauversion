"use client"
import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, Video, FileText } from "lucide-react"

export default function LessonForm({ lesson = {}, onSubmit }) {
  // Initialize state once with lesson data or defaults
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "video",
    duration: "",
  })
  const [videoPreview, setVideoPreview] = useState(null)
  const [documentPreview, setDocumentPreview] = useState(null)
  const [activeTab, setActiveTab] = useState("details")
  const [isInitialized, setIsInitialized] = useState(false)

  // Update form data when lesson prop changes, but only once
  useEffect(() => {
    if (!isInitialized && lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        type: lesson.type || "video",
        duration: lesson.duration || "",
      })
      setIsInitialized(true)
    }
  }, [lesson, isInitialized])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVideoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setDocumentPreview(file.name)
    }
  }

  const handleSubmit = () => {
    // Combine form data with file data
    const completeData = {
      ...formData,
      videoFile: videoPreview ? { name: "video-file.mp4" } : null,
      documentFile: documentPreview ? { name: documentPreview } : null,
    }
    onSubmit(completeData)
  }

  return (
    <div className="space-y-4 py-4">
      <Tabs defaultValue="details" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Lesson Details</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Introduction to Guitar Chords"
              value={formData.title}
              onChange={handleChange}
            />
            {!formData.title && <p className="text-sm text-red-500">Title is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of this lesson"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Lesson Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                name="duration"
                placeholder="e.g. 15 min"
                value={formData.duration}
                onChange={handleChange}
              />
              {!formData.duration && <p className="text-sm text-red-500">Duration is required</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="video" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Video Upload</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              {videoPreview ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-md overflow-hidden">
                    <video src={videoPreview} controls className="w-full h-full" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium truncate">Video uploaded</p>
                    <Button variant="destructive" size="sm" onClick={() => setVideoPreview(null)}>
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
            <Label>Additional Resources</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              {documentPreview ? (
                <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                    <p className="text-sm font-medium truncate">{documentPreview}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDocumentPreview(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload lesson resources</p>
                  <p className="text-xs text-muted-foreground mb-4">PDF, DOCX, or other document formats</p>
                  <Button variant="outline" className="relative">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleDocumentUpload}
                    />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={handleSubmit} disabled={!formData.title || !formData.duration}>
            {lesson.id ? "Update Lesson" : "Add Lesson"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  )
}
