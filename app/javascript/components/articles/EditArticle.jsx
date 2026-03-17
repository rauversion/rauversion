import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { get, put } from '@rails/request.js'
import { Button } from '../ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Switch } from "../ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Loader2, Settings2, X, ImageIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import Dante, {
  defaultTheme,
  darkTheme,
  ImageBlockConfig,
  CodeBlockConfig,
  DividerBlockConfig,
  PlaceholderBlockConfig,
  EmbedBlockConfig,
  VideoBlockConfig,
  GiphyBlockConfig,
  VideoRecorderBlockConfig,
  SpeechToTextBlockConfig,
} from 'dante3/package/esm'
import PlaylistBlock from "./PlaylistBlock";
import AiEnhancerBlock from "./AiEnhancerBlock";
import { ScrollGalleryBlockConfig } from "./scrollGallery";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DirectUpload } from "@rails/activestorage"
import { useDebounceCallback } from "@/hooks/use-debounce-callback"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { ImageUploader } from "../ui/image-uploader"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  excerpt: z.string().optional(),
  // body: z.any(),
  category_id: z.string().refine((value) => value === "null" || /^\d+$/.test(value), {
    message: "Please select a category",
  }),
  private: z.preprocess((v) => v ?? false, z.boolean()),
  state: z.enum(["draft", "published"]),
  tags: z.string().optional(),
  visibility: z.enum(["public", "private"]),
})

const ARTICLE_FORM_FIELDS = new Set([
  "title",
  "excerpt",
  "category_id",
  "private",
  "state",
  "tags",
  "visibility",
  "body",
])

const ARTICLE_FIELD_LABELS = {
  title: "Titulo",
  excerpt: "Descripcion",
  category_id: "Categoria",
  private: "Privacidad",
  state: "Estado",
  tags: "Etiquetas",
  visibility: "Acceso",
  body: "Contenido",
  cover: "Portada",
  base: "General",
}

function humanizeArticleField(field) {
  return ARTICLE_FIELD_LABELS[field] || field.replace(/_/g, " ")
}

function normalizeBackendMessages(value) {
  if (Array.isArray(value)) {
    return value
      .map((message) => (typeof message === "string" ? message.trim() : ""))
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : []
  }

  return []
}

function normalizeBackendValidationPayload(payload) {
  if (!payload) {
    return { fieldErrors: {}, summary: [] }
  }

  if (Array.isArray(payload)) {
    return { fieldErrors: {}, summary: normalizeBackendMessages(payload) }
  }

  const fieldSource =
    payload.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)
      ? payload.errors
      : payload

  const fieldErrors = Object.entries(fieldSource).reduce((acc, [field, value]) => {
    if (field === "full_errors" || field === "summary") {
      return acc
    }

    const messages = normalizeBackendMessages(value)

    if (messages.length > 0) {
      acc[field] = messages
    }

    return acc
  }, {})

  const summary = normalizeBackendMessages(payload.full_errors || payload.summary)

  if (summary.length > 0) {
    return { fieldErrors, summary }
  }

  return {
    fieldErrors,
    summary: Object.entries(fieldErrors).flatMap(([field, messages]) =>
      messages.map((message) =>
        field === "base" ? message : `${humanizeArticleField(field)}: ${message}`
      )
    ),
  }
}

function articleToFormValues(article) {
  return {
    title: article?.title || "",
    excerpt: article?.excerpt || "",
    category_id: article?.category?.id?.toString() || "null",
    private: !!article?.private,
    state: article?.state || "draft",
    tags: article?.tags?.join(", ") || "",
    visibility: article?.private ? "private" : "public",
  }
}

function mergeArticleState(previousArticle, nextArticle) {
  if (!previousArticle) {
    return nextArticle
  }

  if (!nextArticle) {
    return previousArticle
  }

  return {
    ...previousArticle,
    ...nextArticle,
    signed_id: nextArticle.signed_id || previousArticle.signed_id,
    category: nextArticle.category || previousArticle.category,
    cover_url: nextArticle.cover_url || previousArticle.cover_url,
  }
}

// PlaylistBlockConfig for Dante (ESM style)
export function PlaylistBlockConfig(options = {}) {
  // Maintain dialog open state per block key
  const dialogState = {};

  return {
    icon: (props) => (
      <svg
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 24 24"
        onClick={(e) => {
          e.stopPropagation();
          // Set dialog open for this block
          if (props && props.block) {
            dialogState[props.block.key] = true;
            if (props.block.setShowDialog) {
              props.block.setShowDialog(true);
            }
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#fff" stroke="#000" strokeWidth="1.5" />
        <rect x="7" y="9" width="6" height="2" rx="1" fill="#000" />
        <rect x="7" y="13" width="4" height="2" rx="1" fill="#000" />
        <circle cx="17" cy="14" r="2" fill="#000" />
      </svg>
    ),
    name: "PlaylistBlock",
    tag: "playlist-block",
    component: (props) => {
      return <PlaylistBlock {...props} endpoint={'/playlists.json'} />;
    },
    atom: false,
    widget_options: {
      displayOnInlineTooltip: true,
      insertion: "insertion",
      insert_block: "PlaylistBlock",
    },
    options: {
      placeholder: "Insert a playlist",
    },
    attributes: {
      playlistId: { default: null },
    },
    dataSerializer: function (data) {
      return { ...data, playlistId: data.playlistId };
    },
    ...options,
  };
}

export const EditorComponent = React.memo(function EditorComponent({ value, onChange, readOnly = false }) {
  function AiEnhancerBlockConfig(options = {}) {
    return {
      icon: () => (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <g>
            <circle cx="12" cy="12" r="10" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <path d="M12 7v5l3 3" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      ),
      name: "AiEnhancerBlock",
      tag: "ai-enhancer-block",
      component: (props) => <AiEnhancerBlock {...props} />,
      atom: false,
      widget_options: {
        displayOnInlineTooltip: true,
        insertion: "insertion",
        insert_block: "AiEnhancerBlock",
      },
      options: {
        placeholder: "Enhance text with AI",
      },
      attributes: {
        value: { default: "" },
      },
      dataSerializer: function (data) {
        return { ...data, value: data.value };
      },
      ...options,
    };
  }

  const uploadFile = (file, cb) => {
    if (!file) return
    const url = '/api/v1/direct_uploads'
    const upload = new DirectUpload(file, url)

    upload.create((error, blob) => {
      if (error) {
        // Handle the error
      } else {
        cb(blob)
      }
    })
  }

  const widgets = React.useMemo(() => ([
    ImageBlockConfig({
      options: {
        upload_handler: (file, ctx) => {
          uploadFile(file, (blob) => {
            ctx.updateAttributes({
              url: blob.service_url
            })
          })
        }
      }
    }),
    CodeBlockConfig(),
    DividerBlockConfig(),
    PlaceholderBlockConfig(),
    EmbedBlockConfig({
      options: {
        endpoint: "/oembed?url=",
        placeholder: "Paste a link to embed content from another site (e.g. Twitter) and press Enter"
      },
    }),
    VideoBlockConfig({
      options: {
        endpoint: "/oembed?url=",
        placeholder: "Paste a YouTube, Vine, Vimeo, or other video link, and press Enter",
        caption: "Type caption for embed (optional)",
      },
    }),
    GiphyBlockConfig(),
    VideoRecorderBlockConfig({
      options: {
        upload_handler: (file, ctx) => {
          uploadFile(file, (blob) => {
            ctx.updateAttributes({
              url: blob.service_url
            })
          })
        }
      }
    }),
    SpeechToTextBlockConfig(),
    PlaylistBlockConfig(),
    ScrollGalleryBlockConfig({
      options: {
        upload_handler: (file, ctx) => {
          uploadFile(file, (blob) => {
            ctx.updateAttributes({
              url: blob.service_url
            })
          })
        }
      }
    }),
    // AiEnhancerBlockConfig(), // we need to add this to the menu bar instead
  ]), [])

  return (
    <Dante
      theme={darkTheme}
      content={value}
      readOnly={readOnly}
      editorProps={
        {
          attributes: {
            class: 'flex flex-col',
          }
        }
      }
      widgets={widgets}
      onUpdate={(editor) => {
        onChange && onChange(editor.getJSON())
      }}
    />
  )
}, (prevProps, nextProps) => (
  prevProps.value === nextProps.value
  && prevProps.onChange === nextProps.onChange
  && prevProps.readOnly === nextProps.readOnly
))

export default function EditArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [article, setArticle] = React.useState(null)
  const [categories, setCategories] = React.useState([])
  const [states, setStates] = React.useState([])
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [backendValidationErrors, setBackendValidationErrors] = React.useState([])
  const [isSavingSettings, setIsSavingSettings] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef(null)
  const hasSkippedInitialSaveRef = React.useRef(false)

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
      await handleUpload(file)
    }
  }

  const handleUpload = async (file) => {
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
          put(`/articles/${id}`, {
            body: JSON.stringify({
              post: {
                cover_blob_id: blob.signed_id
              }
            }),
            responseKind: 'json'
          }).then(async (response) => {
            if (response.ok) {
              resetBackendValidationState()
              toast({
                title: "Éxito",
                description: "Imagen subida correctamente",
              })
              const { article } = await response.json
              syncArticleState(article)
            } else {
              const payload = await response.json
              applyBackendValidationErrors(payload)
              toast({
                title: "Error",
                description: "No se pudo subir la imagen. Revisa los errores del formulario.",
                variant: "destructive",
              })
            }
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

  const handleImageUpload = async (blobId, cropData) => {
    try {
      const response = await put(`/articles/${id}`, {
        body: JSON.stringify({
          post: {
            cover_blob_id: blobId,
            crop_data: cropData ? JSON.stringify(cropData) : null
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        resetBackendValidationState()
        const { article } = await response.json
        syncArticleState(article)
      } else {
        const payload = await response.json
        applyBackendValidationErrors(payload)
        toast({
          title: "Error",
          description: "No se pudo actualizar la imagen. Revisa los errores del formulario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen",
        variant: "destructive",
      })
    }
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      // body: null,
      category_id: "null",
      private: false,
      state: "draft",
      tags: "",
      visibility: "public"
    },
    mode: "onChange"
  })

  const resetBackendValidationState = React.useCallback(() => {
    setBackendValidationErrors([])
    form.clearErrors()
  }, [form])

  const syncArticleState = React.useCallback((nextArticle) => {
    setArticle((previousArticle) => mergeArticleState(previousArticle, nextArticle))
    form.reset(articleToFormValues(nextArticle))
  }, [form])

  const applyBackendValidationErrors = React.useCallback((payload) => {
    const { fieldErrors, summary } = normalizeBackendValidationPayload(payload)

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!ARTICLE_FORM_FIELDS.has(field) || messages.length === 0) {
        return
      }

      form.setError(field, {
        type: "backend",
        message: messages.join(", "),
      })
    })

    const nextSummary = summary.length > 0
      ? Array.from(new Set(summary))
      : ["No se pudo guardar el articulo. Revisa los campos e intenta otra vez."]

    setBackendValidationErrors(nextSummary)
    form.setError("root", {
      type: "backend",
      message: nextSummary[0],
    })
    setIsDrawerOpen(true)
  }, [form])

  const handleSaveContent = React.useCallback(async (content) => {
    if (!hasSkippedInitialSaveRef.current) {
      hasSkippedInitialSaveRef.current = true
      return
    }

    try {
      const response = await put(`/articles/${id}`, {
        body: JSON.stringify({
          post: {
            body: content
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        toast({
          description: "Contenido guardado",
        })
      }
    } catch (error) {
      console.error('Error saving content:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el contenido",
        variant: "destructive",
      })
    }
  }, [id, toast])

  const editorOnChangeHandler = useDebounceCallback(handleSaveContent, 500)

  React.useEffect(() => {
    hasSkippedInitialSaveRef.current = false
  }, [id])

  React.useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await get(`/articles/${id}/edit.json`)
        if (response.ok) {
          const { article, categories, states } = await response.json
          setArticle(article)
          setCategories(categories)
          setStates(states)
          setBackendValidationErrors([])

          form.reset(articleToFormValues(article))
        }
      } catch (error) {
        console.error('Error fetching article:', error)
        toast({
          title: "Error",
          description: "No se pudo cargar el artículo",
          variant: "destructive",
        })
      }
    }
    fetchArticle()
  }, [id, form, toast])

  const onSubmit = async (data) => {
    setIsSavingSettings(true)
    resetBackendValidationState()

    try {
      const { visibility, ...rest } = data
      const response = await put(`/articles/${id}`, {
        body: JSON.stringify({
          post: {
            ...rest,
            category_id: data.category_id === "null" ? null : data.category_id,
            private: !!data.private
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const { article } = await response.json
        syncArticleState(article)
        setBackendValidationErrors([])
        toast({
          title: "Éxito",
          description: "Artículo actualizado correctamente",
        })
        setIsDrawerOpen(false)
      } else {
        const payload = await response.json
        applyBackendValidationErrors(payload)

        toast({
          title: "Error",
          description: "No se pudo guardar. Revisa los errores del formulario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el artículo",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (!article) return <div>Loading...</div>


  return (
    <div className="container-- mx-auto-- py-10--">
      <Breadcrumb className="mb-6 flex items-center m-4">
        <BreadcrumbItem>
          <BreadcrumbLink href="/articles/mine">Mis Artículos</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="flex items-center" />
        <BreadcrumbItem>
          <BreadcrumbPage>{article?.title || 'Editar Artículo'}</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-end mb-4 mr-4">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] border-l bg-background flex flex-col h-full p-0">
            <SheetHeader className="flex flex-row justify-between items-center border-b pb-4 p-6">
              <div>
                <SheetTitle className="text-lg">Configuracion del articulo</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Edita los metadatos y revisa aqui cualquier error de validacion del backend.
                </p>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </SheetHeader>

            <Form {...form} key={article.id}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-8 py-6">
                    {backendValidationErrors.length > 0 && (
                      <Alert
                        variant="destructive"
                        className="sticky top-0 z-10 border-red-500/50 bg-background/95 backdrop-blur"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No se pudo guardar el artículo</AlertTitle>
                        <AlertDescription>
                          <ul className="mt-3 space-y-2 list-disc pl-5">
                            {backendValidationErrors.map((message, index) => (
                              <li key={`${message}-${index}`}>{message}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  <ImageUploader
                    onUploadComplete={handleImageUpload}
                    aspectRatio={16 / 9}
                    maxSize={10}
                    preview={true}
                    enableCropper={true}
                    imageUrl={article?.cover_url}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Article title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your article"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Category
                    </h4>
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className="w-full"
                                onBlur={field.onBlur}
                              >
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">Ninguna</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="private"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border border-zinc-700 p-4 space-y-3">
                        <div className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>
                              Private
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={(val) => {
                                field.onChange(!!val)
                                form.setValue('visibility', val ? 'private' : 'public', { shouldValidate: true })
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Publicado en la plataforma
                      </h4>
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-sm text-muted">
                        El artículo será publicado en la lista de artículos.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-sm font-medium">
                              Acceso al artículo
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(val) => {
                                  field.onChange(val)
                                  form.setValue('private', val === 'private', { shouldValidate: true })
                                }}
                                value={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="public" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Acceso público
                                  </FormLabel>
                                  <span className="text-sm text-muted">
                                    Todo el mundo con el enlace verá este artículo.
                                  </span>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="private" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Miembros privados al artículo
                                  </FormLabel>
                                  <span className="text-sm text-muted">
                                    Sólo los miembros de este artículo podrían acceder.
                                  </span>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          Compartir
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="text-muted-foreground hover:text-muted-foreground"
                          onClick={() => {
                            if (!article?.signed_id) {
                              toast({
                                title: "Error",
                                description: "No se pudo generar el enlace de previsualizacion.",
                                variant: "destructive",
                              })
                              return
                            }

                            const previewUrl = `${window.location.origin}/articles/${article.signed_id}/preview`
                            navigator.clipboard.writeText(previewUrl)
                            toast({
                              title: "Enlace copiado",
                              description: "El enlace de previsualización ha sido copiado al portapapeles.",
                            })
                          }}
                        >
                          Copiar enlace
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                <div className="border-t border-zinc-800 px-6 py-4 flex justify-end gap-4 bg-background">
                  <SheetClose asChild>
                    <Button variant="secondary" type="button">
                      Cancelar
                    </Button>
                  </SheetClose>
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-500"
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="max-w-4xl-- mx-auto--">
        <div className="prose dark:prose-invert max-w-none">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <EditorComponent
                value={article.body}
                onChange={editorOnChangeHandler}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}
