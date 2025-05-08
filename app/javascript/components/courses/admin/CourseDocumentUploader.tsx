import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText } from "lucide-react"
import { DirectUpload } from "@rails/activestorage"

export default function CourseDocumentUploader({ onDocumentCreate, onDocumentDelete, documents = [] }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return
    setUploading(true)
    const upload = new DirectUpload(selectedFile, "/api/v1/direct_uploads")
    upload.create((error, blob) => {
      setUploading(false)
      if (error) {
        alert("Error uploading document: " + error)
      } else {
        onDocumentCreate && onDocumentCreate({
          signed_id: blob.signed_id,
          filename: selectedFile.name,
          content_type: selectedFile.type,
          byte_size: selectedFile.size,
          service_url: blob.service_url,
        })
        setSelectedFile(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">Upload course document</p>
        <p className="text-xs text-muted-foreground mb-4">PDF, DOCX, or other document formats</p>
        <div className="flex flex-col items-center gap-2 w-full">
          <Button variant="outline" className="relative w-full max-w-xs">
            <Upload className="h-4 w-4 mr-2" />
            {selectedFile ? selectedFile.name : "Select Document"}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
          </Button>
          {selectedFile && (
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" variant="default" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setSelectedFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div>
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id || doc.signed_id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                  <p className="text-sm font-medium truncate">{doc.filename}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDocumentDelete && onDocumentDelete(doc.id || doc.signed_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
