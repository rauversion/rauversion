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

const NAMED_ASPECT_RATIOS = {
  auto: NaN,
  free: NaN,
  square: 1,
  video: 16 / 9,
  landscape: 4 / 3,
  portrait: 3 / 4,
  story: 9 / 16,
}

const humanizeRatioName = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

const resolveAspectRatio = (value) => {
  if (typeof value === "number") return value
  if (value === null) return NaN
  if (typeof value === "string" && Object.prototype.hasOwnProperty.call(NAMED_ASPECT_RATIOS, value)) {
    return NAMED_ASPECT_RATIOS[value]
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 16 / 9
}

const normalizeCropAspectRatio = (option) => {
  if (typeof option === "number" || typeof option === "string" || option === null) {
    return {
      label: option === null ? "Libre" : humanizeRatioName(option),
      value: option,
    }
  }

  return {
    label: option.label || humanizeRatioName(option.value),
    value: option.value,
  }
}

export function ImageUploader({
  onUploadComplete,
  onSuccess,
  onRemove,
  aspectRatio = 16 / 9,
  cropAspectRatios = null,
  maxSize = 10, // MB
  className,
  preview = true,
  enableCropper = true,
  initialCropData = null,
  value = null,
  imageUrl = null,
  imageCropped = null,
  cropUploadMode = "crop" // "crop" (default) or "original_with_coords"
}) {
  const { toast } = useToast()
  const resolvedImageUrl = value ?? imageUrl
  const cropAspectRatioOptions = React.useMemo(
    () => (Array.isArray(cropAspectRatios) && cropAspectRatios.length > 0 ? cropAspectRatios.map(normalizeCropAspectRatio) : []),
    [cropAspectRatios]
  )
  const defaultAspectRatioValue = cropAspectRatioOptions[0]?.value ?? aspectRatio
  const [dragActive, setDragActive] = React.useState(false)
  const [cropperOpen, setCropperOpen] = React.useState(false)
  const [cropData, setCropData] = React.useState(null)
  const [image, setImage] = React.useState(null)
  const [originalFile, setOriginalFile] = React.useState(null)
  const [selectedAspectRatio, setSelectedAspectRatio] = React.useState(defaultAspectRatioValue)
  const cropperRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const [loading, setLoading] = React.useState(false)
  const resolvedAspectRatio = resolveAspectRatio(selectedAspectRatio)

  // Set initial crop data when cropper opens and image is set
  React.useEffect(() => {
    if (
      cropperOpen &&
      initialCropData //&&
      //cropperRef.current &&
      //cropperRef.current.cropper
    ) {
      // Wait a tick to ensure cropper is ready
      setTimeout(() => {
        try {
          console.log('Setting crop data:', initialCropData)
          cropperRef.current.cropper.setData(initialCropData)
        } catch (e) {
          // ignore
        }
      }, 200)
    }
  }, [cropperOpen, initialCropData])

  React.useEffect(() => {
    if (cropperOpen && cropperRef.current?.cropper) {
      cropperRef.current.cropper.setAspectRatio(resolvedAspectRatio)
    }
  }, [cropperOpen, resolvedAspectRatio])

  const notifyUploadResult = React.useCallback((signedBlobId, cropData, serviceUrl) => {
    if (typeof onUploadComplete === "function") {
      onUploadComplete(signedBlobId, cropData, serviceUrl)
    }

    if (typeof onSuccess === "function") {
      onSuccess(serviceUrl, cropData, signedBlobId)
    }
  }, [onSuccess, onUploadComplete])

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
        setOriginalFile(file)
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    } else {
      await handleUpload(file)
    }
  }

  const handleUpload = async (file, cropData = null) => {
    setLoading(true)
    try {
      const upload = new DirectUpload(
        file,
        '/api/v1/direct_uploads'
      )

      upload.create((error, blob) => {
        setLoading(false)
        if (error) {
          console.error('Error uploading file:', error)
          toast({
            title: "Error",
            description: "No se pudo subir la imagen",
            variant: "destructive",
          })
        } else {
          const serviceUrl = blob.service_url
          notifyUploadResult(blob.signed_id, cropData, serviceUrl)
          toast({
            title: "Éxito",
            description: "Imagen subida correctamente",
          })
        }
      })
    } catch (error) {
      setLoading(false)
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

  const selectAspectRatio = (value) => {
    setSelectedAspectRatio(value)
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.setAspectRatio(resolveAspectRatio(value))
    }
  }

  const getCropData = async () => {
    if (cropperRef.current?.cropper) {
      const cropper = cropperRef.current.cropper
      const cropAspectRatio = resolveAspectRatio(selectedAspectRatio)
      const cropData = {
        x: cropper.getData().x,
        y: cropper.getData().y,
        width: cropper.getData().width,
        height: cropper.getData().height,
        rotation: cropper.getData().rotate,
        scaleX: cropper.getData().scaleX,
        scaleY: cropper.getData().scaleY,
        aspectRatio: Number.isFinite(cropAspectRatio) ? cropAspectRatio : null,
        aspectRatioPreset: selectedAspectRatio
      }

      if (!originalFile && image && image === resolvedImageUrl) {
        // Cropping an already-uploaded image: just send new cropData
        // Assume parent has the signed_id and imageUrl
        notifyUploadResult(undefined, cropData, resolvedImageUrl)
        setCropperOpen(false)
      } else if (cropUploadMode === "original_with_coords" && originalFile) {
        // Upload original file, send cropData
        await handleUpload(originalFile, cropData)
        setCropperOpen(false)
        setOriginalFile(null)
      } else {
        // Default: upload cropped image
        const canvas = cropper.getCroppedCanvas()
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve))
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
        await handleUpload(file, cropData)
        setCropperOpen(false)
        setOriginalFile(null)
      }
    }
  }

  return (
    <>
      <div className="relative">
        <div
          className={cn(
            "flex border border-dashed rounded-lg p-4 space-y-4",
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
            {preview && resolvedImageUrl ? (
              <>
                <img
                  src={imageCropped || resolvedImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              </>
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
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        )}
      </div>

      {preview && resolvedImageUrl && (
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={e => {
                e.stopPropagation()
                setImage(resolvedImageUrl)
                setOriginalFile(null)
                setCropperOpen(true)
              }}
            >
              Crop
            </Button>
            {typeof onRemove === "function" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={e => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      )
      }

      <Dialog open={cropperOpen} onOpenChange={setCropperOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ajustar imagen</DialogTitle>
            <DialogDescription>
              Recorta y ajusta la imagen antes de subirla
            </DialogDescription>
          </DialogHeader>

          {cropAspectRatioOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cropAspectRatioOptions.map((option) => (
                <Button
                  key={`${option.label}-${option.value}`}
                  type="button"
                  size="sm"
                  variant={option.value === selectedAspectRatio ? "default" : "outline"}
                  onClick={() => selectAspectRatio(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <Cropper
              ref={cropperRef}
              aspectRatio={resolvedAspectRatio}
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
