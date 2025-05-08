"use client"
import React from "react"
import { useState } from "react"
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
import { Plus, Trash2, FileText, Music2, Download, Upload, X } from "lucide-react"

export default function ResourcesManager({ resources = [], onResourcesChange }) {
  const [newResource, setNewResource] = useState({
    title: "",
    type: "document",
    file: null,
  })

  const handleAddResource = () => {
    if (!newResource.title.trim() || !newResource.file) return

    const updatedResources = [
      ...resources,
      {
        id: Date.now(),
        title: newResource.title,
        type: newResource.type,
        fileName: newResource.file.name,
        fileSize: formatFileSize(newResource.file.size),
        file: newResource.file,
      },
    ]

    onResourcesChange(updatedResources)
    setNewResource({ title: "", type: "document", file: null })
  }

  const handleDeleteResource = (resourceId) => {
    const updatedResources = resources.filter((resource) => resource.id !== resourceId)
    onResourcesChange(updatedResources)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Determine file type based on extension
      const fileExtension = file.name.split(".").pop().toLowerCase()
      let type = "document"

      if (["mp3", "wav", "ogg"].includes(fileExtension)) {
        type = "audio"
      } else if (["mp4", "mov", "webm"].includes(fileExtension)) {
        type = "video"
      }

      setNewResource((prev) => ({
        ...prev,
        file,
        type,
      }))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case "audio":
        return <Music2 className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <CardTitle>Course Resources</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Course Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="resource-title">Resource Title</Label>
                <Input
                  id="resource-title"
                  placeholder="e.g. Course Workbook"
                  value={newResource.title}
                  onChange={(e) => setNewResource((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  {newResource.file ? (
                    <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                      <div className="flex items-center">
                        {getResourceIcon(newResource.type)}
                        <div className="ml-2">
                          <p className="text-sm font-medium truncate">{newResource.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(newResource.file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setNewResource((prev) => ({ ...prev, file: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload course resource</p>
                      <p className="text-xs text-muted-foreground mb-4">PDF, audio files, or other materials</p>
                      <Button variant="outline" className="relative">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleAddResource} disabled={!newResource.title || !newResource.file}>
                  Add Resource
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No resources added yet. Click "Add Resource" to upload course materials.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center p-3 rounded-md border">
                <div className="mr-3 text-muted-foreground">{getResourceIcon(resource.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{resource.title}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>{resource.fileName}</span>
                    <span className="mx-1">•</span>
                    <span>{resource.fileSize}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteResource(resource.id)}
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
