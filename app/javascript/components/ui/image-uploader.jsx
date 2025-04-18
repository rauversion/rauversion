import React from 'react'
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"
import { DirectUpload } from "@rails/activestorage"
import { useToast } from "@/hooks/use-toast"
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function ImageUploader({ 
  onUploadComplete,
  aspectRatio = 16/9,
  maxSize = 10, // MB
  className,
  preview = true,
  enableCropper = true,
  imageUrl = null
}) {
  const { toast } = useToast()
  const [dragActive, setDragActive] = React.useState(false)
  const [cropperOpen, setCropperOpen] = React.useState(false)
  const [cropData, setCropData] = React.useState(null)
  const [image, setImage] = React.useState(null)
  const cropperRef = React.useRef(null)
  const inputRef = React.useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleFile = async (file) => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Error",
        description: `El archivo es demasiado grande. Máximo ${maxSize}MB permitido.`,
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido",
        variant: "destructive",
      })
      return
    }

    if (enableCropper) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result)
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    } else {
      await handleUpload(file)
    }
  }

  const handleUpload = async (file, cropData = null) => {
    try {
      const upload = new DirectUpload(
        file,
        '/rails/active_storage/direct_uploads'
      )

      upload.create((error, blob) => {
        if (error) {
          console.error('Error uploading file:', error)
          toast({
            title: "Error",
            description: "No se pudo subir la imagen",
            variant: "destructive",
          })
        } else {
          onUploadComplete(blob.signed_id, cropData)
          toast({
            title: "Éxito",
            description: "Imagen subida correctamente",
          })
        }
      })
    } catch (error) {
      console.error('Error in upload:', error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      })
    }
  }

  const onButtonClick = () => {
    inputRef.current.click()
  }

  const getCropData = async () => {
    if (cropperRef.current?.cropper) {
      const canvas = cropperRef.current.cropper.getCroppedCanvas()
      const cropData = {
        x: cropperRef.current.cropper.getData().x,
        y: cropperRef.current.cropper.getData().y,
        width: cropperRef.current.cropper.getData().width,
        height: cropperRef.current.cropper.getData().height,
        rotation: cropperRef.current.cropper.getData().rotate,
        scaleX: cropperRef.current.cropper.getData().scaleX,
        scaleY: cropperRef.current.cropper.getData().scaleY
      }
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve))
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
      
      await handleUpload(file, cropData)
      setCropperOpen(false)
    }
  }

  return (
    <>
      <div 
        className={cn(
          "border border-dashed rounded-lg p-4 space-y-4",
          dragActive ? "border-pink-500" : "border-zinc-700",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0]
            if (file) {
              handleFile(file)
            }
          }}
        />
        <div 
          className="aspect-[16/9]- py-4 bg-subtle rounded-lg flex items-center justify-center cursor-pointer"
          onClick={onButtonClick}
        >
          {preview && imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <ImageIcon className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-500">
                Subir imagen o arrastra y suelta
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                PNG, JPG, GIF hasta {maxSize}MB
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajustar imagen</DialogTitle>
            <DialogDescription>
              Recorta y ajusta la imagen antes de subirla
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Cropper
              ref={cropperRef}
              aspectRatio={aspectRatio}
              src={image}
              viewMode={1}
              width={800}
              height={450}
              background={false}
              responsive
              autoCropArea={1}
              checkOrientation={false}
              guides={true}
              className="max-h-[60vh]"
            />
          </div>

          <div className="mt-4 flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCropperOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={getCropData}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
