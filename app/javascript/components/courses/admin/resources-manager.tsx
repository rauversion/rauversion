"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, FileText, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { get, post, destroy } from "@rails/request.js"
import { DirectUpload } from "@rails/activestorage"

interface CourseDocument {
  id: number
  title: string
  name: string
  file_url?: string
}

interface ResourcesManagerProps {
  courseId: number | string
}

export default function ResourcesManager({ courseId }: ResourcesManagerProps) {
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [newResource, setNewResource] = useState<{ title: string; file: File | null }>({ title: "", file: null })
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
    // eslint-disable-next-line
  }, [courseId])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await get(`/courses/${courseId}/course_documents.json`)
      if (response.ok) {
        const data = await response.json
        setDocuments(data)
      } else {
        toast({ description: "Failed to fetch course documents", variant: "destructive" })
      }
    } catch (err) {
      toast({ description: "Error fetching course documents", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewResource((prev) => ({ ...prev, file }))
    }
  }

  const handleAddResource = async () => {
    if (!newResource.title.trim() || !newResource.file) return
    setUploading(true)
    try {
      // Direct upload to storage
      const upload = new DirectUpload(newResource.file, "/api/v1/direct_uploads")
      upload.create(async (error, blob) => {
        if (error) {
          setUploading(false)
          toast({ description: "Error uploading file: " + error, variant: "destructive" })
        } else {
          // POST to backend with signed_id
          const payload = {
            course_document: {
              title: newResource.title,
              file: blob.signed_id,
              name: newResource.file.name,
            }
          }
          const response = await post(`/courses/${courseId}/course_documents.json`, {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          })
          if (response.ok) {
            const data = await response.json
            setDocuments((prev) => [...prev, data])
            toast({ description: "Resource added!" })
            setNewResource({ title: "", file: null })
            setDialogOpen(false)
          } else {
            const data = await response.json
            toast({ description: data.errors?.join(", ") || "Failed to add resource", variant: "destructive" })
          }
          setUploading(false)
        }
      })
    } catch (err) {
      setUploading(false)
      toast({ description: "Error adding resource", variant: "destructive" })
    }
  }

  const handleDeleteResource = async (id: number) => {
    try {
      const response = await destroy(`/courses/${courseId}/course_documents/${id}.json`)
      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
        toast({ description: "Resource deleted" })
      } else {
        toast({ description: "Failed to delete resource", variant: "destructive" })
      }
    } catch (err) {
      toast({ description: "Error deleting resource", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <CardTitle>{I18n.t("courses.resources_manager.course_resources")}</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="h-4 w-4 mr-2-" />
              <span className="hidden md:inline">
                {I18n.t("courses.resources_manager.add_resource")}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{I18n.t("courses.resources_manager.add_course_resource")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="resource-title">{I18n.t("courses.resources_manager.resource_title")}</Label>
                <Input
                  id="resource-title"
                  placeholder={I18n.t("courses.resources_manager.resource_title_placeholder")}
                  value={newResource.title}
                  onChange={(e) => setNewResource((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-file">{I18n.t("courses.resources_manager.upload_file")}</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  {newResource.file ? (
                    <div className="flex justify-between items-center p-3 bg-muted rounded-md w-full max-w-xs">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="ml-2">
                          <p className="text-sm font-medium truncate">{newResource.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(newResource.file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setNewResource((prev) => ({ ...prev, file: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 w-full">
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">{I18n.t("courses.resources_manager.upload_course_resource")}</p>
                      <p className="text-xs text-muted-foreground mb-4">{I18n.t("courses.resources_manager.accepted_formats")}</p>
                      <Button variant="outline" className="relative w-full max-w-xs">
                        <Upload className="h-4 w-4 mr-2" />
                        {I18n.t("courses.resources_manager.select_file")}
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.txt,.mp3,.wav,.ogg,.mp4,.mov,.webm"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setNewResource({ title: "", file: null })}>{I18n.t("courses.resources_manager.cancel")}</Button>
              </DialogClose>
              <Button onClick={handleAddResource} disabled={!newResource.title || !newResource.file || uploading}>
                {uploading ? I18n.t("courses.resources_manager.uploading") : I18n.t("courses.resources_manager.add_resource")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">{I18n.t("courses.resources_manager.loading_resources")}</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{I18n.t("courses.resources_manager.no_resources")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center p-3 rounded-md border">
                <div className="mr-3 text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>{doc.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Download button could be implemented if file_url is available */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteResource(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
