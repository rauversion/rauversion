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
import { Settings2, X, ImageIcon } from "lucide-react"
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
import { DirectUpload } from "@rails/activestorage"
import { useDebounce } from '@/hooks/use_debounce'
import { useDebounceCallback } from "@/hooks/use-debounce-callback"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { ImageUploader } from "../ui/image-uploader"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"


const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  excerpt: z.string().optional(),
  // body: z.any(),
  category_id: z.string().refine((val) => val === "null" || /^\d+$/.test(val), {
    message: "Please select a valid category",
  }),
  private: z.boolean().default(false),
  state: z.enum(["draft", "published"]),
  tags: z.string().optional(),
  visibility: z.enum(["public", "private"]),
})

function EditorComponent({ value, onChange, onUpload }) {
  const debouncedValue = useDebounce(value, 500)
  
  React.useEffect(() => {
    onChange?.(debouncedValue)
  }, [debouncedValue])

  const uploadFile = (file, cb) => {
    if(!file) return
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

  return (
    <Dante 
      theme={darkTheme}
      content={value}
      widgets={[
        ImageBlockConfig({
          options: {
            upload_handler: (file, ctx) => {
              uploadFile(file, (blob)=>{
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
      ]}
      onUpdate={(editor) => {
        onChange && onChange(editor.getJSON())
      }}
    />
  )
}

export default function EditArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [article, setArticle] = React.useState(null)
  const [categories, setCategories] = React.useState([])
  const [states, setStates] = React.useState([])
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
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
              toast({
                title: "Éxito",
                description: "Imagen subida correctamente",
              })
              const { article } = await response.json
              setArticle(article)
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
        const { article } = await response.json
        setArticle(article)
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

  const handleSaveContent = React.useCallback(async (content) => {
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
        const { article } = await response.json
        // setArticle(article)
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
  }, [id])

  const editorOnChangeHandler = useDebounceCallback(handleSaveContent, 500)

  React.useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await get(`/articles/${id}/edit.json`)
        if (response.ok) {
          const { article, categories, states } = await response.json
          setArticle(article)
          setCategories(categories)
          setStates(states)
          
          form.reset({
            title: article.title,
            excerpt: article.excerpt || "",
            // body: article.body,
            category_id: article.category?.id?.toString() || "null",
            private: article.private,
            state: article.state,
            tags: article.tags?.join(", ") || "",
            visibility: article.private ? "private" : "public"
          })
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
  }, [id])

  const onSubmit = async (data) => {
    try {
      const response = await put(`/articles/${id}`, {
        body: JSON.stringify({
          post: {
            ...data,
            private: data.visibility === 'private'
          }
        }),
        responseKind: 'json'
      })

      if (response.ok) {
        const { article } = await response.json
        setArticle(article)
        form.reset(data)
        toast({
          title: "Éxito",
          description: "Artículo actualizado correctamente",
        })
        setIsDrawerOpen(false)
      } else {
        const { errors } = await response.json
        Object.keys(errors).forEach((key) => {
          form.setError(key, {
            type: 'manual',
            message: errors[key].join(', ')
          })
        })
        
        toast({
          title: "Error",
          description: "Por favor corrige los errores en el formulario",
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
    }
  }

  if (!article) return <div>Loading...</div>

  
  return (
    <div className="container mx-auto py-10">
      <Breadcrumb className="mb-6 flex items-center">
        <BreadcrumbItem>
          <BreadcrumbLink href="/articles/mine">Mis Artículos</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="flex items-center" />
        <BreadcrumbItem>
          <BreadcrumbPage>{article?.title || 'Editar Artículo'}</BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-end mb-4">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] border-l bg-zinc-900 flex flex-col h-full p-0">
            <SheetHeader className="flex flex-row justify-between items-center border-b pb-4 p-6">
              <div>
                <SheetTitle className="text-lg">Nuevo artículo</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Comienza rellenando la siguiente información para crear tu nuevo artículo.
                </p>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6">
                  <ImageUploader
                    onUploadComplete={handleImageUpload}
                    aspectRatio={16/9}
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
                        <FormLabel className="text-zinc-300">Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Article title" 
                            {...field}
                            className="bg-zinc-800 border-zinc-700" 
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
                        <FormLabel className="text-zinc-300">Excerpt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your article"
                            {...field}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="private"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-zinc-300">
                            Private
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-zinc-300">
                        Publicado en la plataforma
                      </h4>
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
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
                        )}
                      />
                      <p className="text-sm text-zinc-500">
                        El artículo será publicado en la lista de artículos.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-sm font-medium text-zinc-300">
                              Acceso al artículo
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="public" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-zinc-300">
                                    Acceso público
                                  </FormLabel>
                                  <span className="text-sm text-zinc-500">
                                    Todo el mundo con el enlace verá este artículo.
                                  </span>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="private" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-zinc-300">
                                    Miembros privados al artículo
                                  </FormLabel>
                                  <span className="text-sm text-zinc-500">
                                    Sólo los miembros de este artículo podrían acceder.
                                  </span>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-zinc-300">
                        Category
                      </h4>
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
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
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-zinc-300">
                          Compartir
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-500 hover:text-zinc-400"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            toast({
                              title: "Enlace copiado",
                              description: "El enlace ha sido copiado al portapapeles.",
                            })
                          }}
                        >
                          Copiar enlace
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-zinc-400 w-full justify-start"
                        onClick={() => {
                          // Open sharing info modal or tooltip
                        }}
                      >
                        Más información sobre compartir
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>

            <div className="border-t border-zinc-800 mt-auto p-6">
              <div className="flex justify-end gap-4">
                <SheetClose asChild>
                  <Button variant="outline" className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                    Cancelar
                  </Button>
                </SheetClose>
                <Button 
                  type="submit" 
                  className="bg-pink-600 hover:bg-pink-500"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={!form.formState.isDirty || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="max-w-4xl mx-auto">
      <div className="prose dark:prose-invert max-w-none">
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <EditorComponent
              value={article.body}
              onChange={editorOnChangeHandler}
              onUpload={handleUpload}
            />
          )}
        />
      </div>
      </div>
    </div>
  )
