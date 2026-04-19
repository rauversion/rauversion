"use client"

import React from "react"
import { Plus, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"

import { Button } from "@/components/ui/button"
import { ImageUploader } from "@/components/ui/image-uploader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type {
  EmailBlock,
  EmailGalleryImage,
  EmailLinkItem,
} from "@/lib/email-editor/types"
import { EmailRichTextEditor } from "./email-rich-text-editor"

interface EmailBlockSettingsProps {
  block: EmailBlock | null
  onUpdate: (id: string, props: Record<string, unknown>) => void
  onRemove: (id: string) => void
}

export function EmailBlockSettings({
  block,
  onUpdate,
  onRemove,
}: EmailBlockSettingsProps) {
  if (!block) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Selecciona un bloque para editar sus propiedades.
      </div>
    )
  }

  const handleUpdate = (key: string, value: unknown) => onUpdate(block.id, { [key]: value })

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Bloque</h3>
          <p className="text-xs text-muted-foreground">{block.type}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemove(block.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {block.type === "heading" ? (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={block.props.text} onChange={(event) => handleUpdate("text", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input value={block.props.subtitle || ""} onChange={(event) => handleUpdate("subtitle", event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={block.props.level} onValueChange={(value) => handleUpdate("level", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamaño</Label>
              <Select value={block.props.size} onValueChange={(value) => handleUpdate("size", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Alineación</Label>
              <Select value={block.props.align} onValueChange={(value) => handleUpdate("align", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input type="color" value={block.props.color || "#1f1a17"} onChange={(event) => handleUpdate("color", event.target.value)} className="h-10 p-1" />
            </div>
          </div>
        </>
      ) : null}

      {block.type === "text" ? (
        <>
          <div className="space-y-2">
            <Label>Contenido</Label>
            <EmailRichTextEditor
              content={block.props.content}
              size={block.props.size}
              alignment={block.props.align}
              onUpdate={(content) => handleUpdate("content", content)}
              onAlignmentChange={(align) => handleUpdate("align", align)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tamaño</Label>
              <Select value={block.props.size} onValueChange={(value) => handleUpdate("size", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input type="color" value={block.props.color || "#3b2f2f"} onChange={(event) => handleUpdate("color", event.target.value)} className="h-10 p-1" />
            </div>
          </div>
        </>
      ) : null}

      {block.type === "image" ? (
        <>
          <div className="space-y-2">
            <Label>Imagen</Label>
            <ImageUploader value={block.props.src} onSuccess={(url) => handleUpdate("src", url)} onRemove={() => handleUpdate("src", "")} aspectRatio="video" />
          </div>
          <div className="space-y-2">
            <Label>Alt text</Label>
            <Input value={block.props.alt} onChange={(event) => handleUpdate("alt", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input value={block.props.href || ""} onChange={(event) => handleUpdate("href", event.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Alineación</Label>
              <Select value={block.props.align} onValueChange={(value) => handleUpdate("align", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ancho</Label>
              <Select value={block.props.width} onValueChange={(value) => handleUpdate("width", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Radio</Label>
            <Select value={block.props.borderRadius} onValueChange={(value) => handleUpdate("borderRadius", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}

      {block.type === "gallery" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Columnas</Label>
              <Select value={String(block.props.columns)} onValueChange={(value) => handleUpdate("columns", value === "3" ? 3 : 2)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columnas</SelectItem>
                  <SelectItem value="3">3 columnas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gap</Label>
              <Select value={block.props.gap} onValueChange={(value) => handleUpdate("gap", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Mostrar captions</Label>
            <Switch checked={block.props.showCaptions} onCheckedChange={(value) => handleUpdate("showCaptions", value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Imágenes</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleUpdate("images", [...block.props.images, { id: nanoid(), src: "", alt: "", caption: "" } satisfies EmailGalleryImage])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
            <ScrollArea className="h-72">
              <div className="space-y-3 pr-2">
                {block.props.images.map((image) => (
                  <div key={image.id} className="space-y-2 rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Imagen</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleUpdate("images", block.props.images.filter((item) => item.id !== image.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ImageUploader
                      value={image.src}
                      onSuccess={(url) => handleUpdate("images", block.props.images.map((item) => item.id === image.id ? { ...item, src: url } : item))}
                      onRemove={() => handleUpdate("images", block.props.images.map((item) => item.id === image.id ? { ...item, src: "" } : item))}
                      aspectRatio="square"
                    />
                    <Input value={image.alt} onChange={(event) => handleUpdate("images", block.props.images.map((item) => item.id === image.id ? { ...item, alt: event.target.value } : item))} placeholder="Alt text" />
                    <Input value={image.caption || ""} onChange={(event) => handleUpdate("images", block.props.images.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item))} placeholder="Caption" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      ) : null}

      {block.type === "links" ? (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={block.props.title || ""} onChange={(event) => handleUpdate("title", event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select value={block.props.layout} onValueChange={(value) => handleUpdate("layout", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buttons">Botones</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alineación</Label>
              <Select value={block.props.align} onValueChange={(value) => handleUpdate("align", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Links</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => handleUpdate("links", [...block.props.links, { id: nanoid(), label: "", url: "" } satisfies EmailLinkItem])}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
            <div className="space-y-3">
              {block.props.links.map((link) => (
                <div key={link.id} className="space-y-2 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Link</span>
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUpdate("links", block.props.links.filter((item) => item.id !== link.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input value={link.label} onChange={(event) => handleUpdate("links", block.props.links.map((item) => item.id === link.id ? { ...item, label: event.target.value } : item))} placeholder="Label" />
                  <Input value={link.url} onChange={(event) => handleUpdate("links", block.props.links.map((item) => item.id === link.id ? { ...item, url: event.target.value } : item))} placeholder="https://..." />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {block.type === "bio" ? (
        <>
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={block.props.layout} onValueChange={(value) => handleUpdate("layout", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stacked">Stacked</SelectItem>
                <SelectItem value="split">Split</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Imagen</Label>
            <ImageUploader value={block.props.image || ""} onSuccess={(url) => handleUpdate("image", url)} onRemove={() => handleUpdate("image", "")} aspectRatio="square" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={block.props.name} onChange={(event) => handleUpdate("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Input value={block.props.role || ""} onChange={(event) => handleUpdate("role", event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={block.props.bio} onChange={(event) => handleUpdate("bio", event.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Forma de imagen</Label>
            <Select value={block.props.imageShape} onValueChange={(value) => handleUpdate("imageShape", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CTA text</Label>
              <Input value={block.props.ctaText || ""} onChange={(event) => handleUpdate("ctaText", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input value={block.props.ctaUrl || ""} onChange={(event) => handleUpdate("ctaUrl", event.target.value)} placeholder="https://..." />
            </div>
          </div>
        </>
      ) : null}

      {block.type === "button" ? (
        <>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input value={block.props.text} onChange={(event) => handleUpdate("text", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input value={block.props.href} onChange={(event) => handleUpdate("href", event.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(value) => handleUpdate("variant", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamaño</Label>
              <Select value={block.props.size} onValueChange={(value) => handleUpdate("size", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alineación</Label>
            <Select value={block.props.align} onValueChange={(value) => handleUpdate("align", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}

      {block.type === "divider" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Grosor</Label>
              <Select value={String(block.props.thickness)} onValueChange={(value) => handleUpdate("thickness", Number(value) as 1 | 2 | 3)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1px</SelectItem>
                  <SelectItem value="2">2px</SelectItem>
                  <SelectItem value="3">3px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ancho</Label>
              <Select value={block.props.width} onValueChange={(value) => handleUpdate("width", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Spacing</Label>
              <Select value={block.props.spacing} onValueChange={(value) => handleUpdate("spacing", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input type="color" value={block.props.color || "#b85c38"} onChange={(event) => handleUpdate("color", event.target.value)} className="h-10 p-1" />
            </div>
          </div>
        </>
      ) : null}

      {block.type === "spacer" ? (
        <div className="space-y-2">
          <Label>Altura</Label>
          <Select value={String(block.props.height)} onValueChange={(value) => handleUpdate("height", Number(value) as 16 | 24 | 32 | 48 | 64)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="24">24px</SelectItem>
              <SelectItem value="32">32px</SelectItem>
              <SelectItem value="48">48px</SelectItem>
              <SelectItem value="64">64px</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {block.type === "section" ? (
        <>
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={block.props.layout} onValueChange={(value) => handleUpdate("layout", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="image-left">Imagen izquierda</SelectItem>
                <SelectItem value="image-right">Imagen derecha</SelectItem>
                <SelectItem value="stacked">Stacked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Eyebrow</Label>
            <Input value={block.props.eyebrow || ""} onChange={(event) => handleUpdate("eyebrow", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={block.props.title} onChange={(event) => handleUpdate("title", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <EmailRichTextEditor content={block.props.body} onUpdate={(content) => handleUpdate("body", content)} />
          </div>
          <div className="space-y-2">
            <Label>Imagen</Label>
            <ImageUploader value={block.props.image || ""} onSuccess={(url) => handleUpdate("image", url)} onRemove={() => handleUpdate("image", "")} aspectRatio="video" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CTA text</Label>
              <Input value={block.props.ctaText || ""} onChange={(event) => handleUpdate("ctaText", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input value={block.props.ctaUrl || ""} onChange={(event) => handleUpdate("ctaUrl", event.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Background</Label>
            <Input type="color" value={block.props.backgroundColor || "#ffffff"} onChange={(event) => handleUpdate("backgroundColor", event.target.value)} className="h-10 p-1" />
          </div>
        </>
      ) : null}
    </div>
  )
}
