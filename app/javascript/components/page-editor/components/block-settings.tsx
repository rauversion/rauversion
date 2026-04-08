"use client"

import React from "react"
import type { Block } from "@/lib/blocks/types"
import { getBlockEntry } from "@/lib/blocks/registry"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, X, Plus, GripVertical } from "lucide-react"
import { ImageUploader } from "@/components/ui/image-uploader"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import PlaylistSelectorSingle from "@/components/playlists/PlaylistSelectorSingle"
import ProductSelectorSingle from "./ProductSelectorSingle"
import PlaylistSelectorMulti from "./PlaylistSelectorMulti"
import EventSelectorSingle from "./EventSelectorSingle"
import type { 
  SocialLink, 
  SocialPlatform, 
  TourDate,
  GalleryImage,
  Credit,
  PressQuote,
  Stat,
  Album,
  AccordionItem,
  TabItem,
  MerchItem,
} from "@/lib/blocks/types"
import { nanoid } from "nanoid"

interface BlockSettingsProps {
  block: Block | null
  onUpdate: (id: string, props: Record<string, unknown>) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export function BlockSettings({
  block,
  onUpdate,
  onRemove,
  onClose,
}: BlockSettingsProps) {
  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <p className="text-sm text-center">
          Selecciona un bloque para editar sus propiedades
        </p>
      </div>
    )
  }

  const entry = getBlockEntry(block.type)
  const Icon = entry?.icon

  const handleUpdate = (key: string, value: unknown) => {
    onUpdate(block.id, { [key]: value })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <span className="font-medium">{entry?.label || block.type}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {block.type === "text" && (
          <>
            <div className="space-y-2">
              <Label>Tamano de texto</Label>
              <Select
                value={block.props.proseSize || "base"}
                onValueChange={(v) => handleUpdate("proseSize", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno (prose-sm)</SelectItem>
                  <SelectItem value="base">Normal (prose-base)</SelectItem>
                  <SelectItem value="lg">Grande (prose-lg)</SelectItem>
                  <SelectItem value="xl">Extra grande (prose-xl)</SelectItem>
                  <SelectItem value="2xl">Enorme (prose-2xl)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select
                value={block.props.alignment}
                onValueChange={(v) => handleUpdate("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === "image" && (
          <>
            <div className="space-y-2">
              <Label>Imagen</Label>
              <ImageUploader
                value={block.props.src}
                onSuccess={(dataUrl) => handleUpdate("src", dataUrl)}
                onRemove={() => handleUpdate("src", "")}
                aspectRatio={block.props.aspectRatio || "video"}
              />
              <p className="text-xs text-muted-foreground">O pega una URL:</p>
              <Input
                value={block.props.src}
                onChange={(e) => handleUpdate("src", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto alternativo</Label>
              <Input
                value={block.props.alt}
                onChange={(e) => handleUpdate("alt", e.target.value)}
                placeholder="Descripcion de la imagen"
              />
            </div>
            <div className="space-y-2">
              <Label>Ajuste</Label>
              <Select
                value={block.props.fit}
                onValueChange={(v) => handleUpdate("fit", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="fill">Fill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bordes</Label>
              <Select
                value={block.props.rounded}
                onValueChange={(v) => handleUpdate("rounded", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin bordes</SelectItem>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="full">Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proporcion</Label>
              <Select
                value={block.props.aspectRatio || "auto"}
                onValueChange={(v) => handleUpdate("aspectRatio", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="square">Cuadrado</SelectItem>
                  <SelectItem value="video">Video (16:9)</SelectItem>
                  <SelectItem value="portrait">Retrato (3:4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === "spacer" && (
          <div className="space-y-2">
            <Label>Altura</Label>
            <Select
              value={block.props.height}
              onValueChange={(v) => handleUpdate("height", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Pequeno (16px)</SelectItem>
                <SelectItem value="md">Mediano (32px)</SelectItem>
                <SelectItem value="lg">Grande (64px)</SelectItem>
                <SelectItem value="xl">Extra grande (96px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {block.type === "product-item" && (
          <>
            <div className="space-y-2">
              <Label>Producto de tu cuenta</Label>
              <ProductSelectorSingle
                value={block.props.productId || null}
                placeholder="Busca un producto de tu cuenta..."
                onChange={(productId) => handleUpdate("productId", productId || "")}
              />
              <Input
                value={block.props.productId}
                onChange={(e) => handleUpdate("productId", e.target.value)}
                placeholder="Slug, id o URL del producto"
              />
            </div>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proporcion de imagen</Label>
              <Select
                value={block.props.aspectRatio}
                onValueChange={(v) => handleUpdate("aspectRatio", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Cuadrado</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="portrait">Retrato</SelectItem>
                  <SelectItem value="wide">Panoramico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sombra</Label>
              <Select
                value={block.props.shadow}
                onValueChange={(v) => handleUpdate("shadow", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sombra</SelectItem>
                  <SelectItem value="sm">Pequena</SelectItem>
                  <SelectItem value="md">Mediana</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hover</Label>
              <Select
                value={block.props.hoverEffect}
                onValueChange={(v) => handleUpdate("hoverEffect", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin efecto</SelectItem>
                  <SelectItem value="lift">Lift</SelectItem>
                  <SelectItem value="grow">Grow</SelectItem>
                  <SelectItem value="shadow">Shadow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Esquinas</Label>
              <Select
                value={block.props.roundedCorners}
                onValueChange={(v) => handleUpdate("roundedCorners", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Rectas</SelectItem>
                  <SelectItem value="sm">Pequenas</SelectItem>
                  <SelectItem value="md">Medianas</SelectItem>
                  <SelectItem value="lg">Grandes</SelectItem>
                  <SelectItem value="full">Extra grandes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar galeria</Label>
              <Switch
                checked={block.props.showGallery}
                onCheckedChange={(v) => handleUpdate("showGallery", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto del boton</Label>
              <Input
                value={block.props.buttonText}
                onChange={(e) => handleUpdate("buttonText", e.target.value)}
                placeholder="Agregar al carrito"
              />
            </div>
            <div className="space-y-2">
              <Label>Estilo del boton</Label>
              <Select
                value={block.props.buttonStyle}
                onValueChange={(v) => handleUpdate("buttonStyle", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color de fondo</Label>
              <Input
                value={block.props.backgroundColor}
                onChange={(e) => handleUpdate("backgroundColor", e.target.value)}
                placeholder="#FFFFFF"
              />
            </div>
            <div className="space-y-2">
              <Label>Color del borde</Label>
              <Input
                value={block.props.borderColor}
                onChange={(e) => handleUpdate("borderColor", e.target.value)}
                placeholder="#E5E7EB"
              />
            </div>
            <div className="space-y-2">
              <Label>Color del titulo</Label>
              <Input
                value={block.props.titleColor}
                onChange={(e) => handleUpdate("titleColor", e.target.value)}
                placeholder="#111827"
              />
            </div>
            <div className="space-y-2">
              <Label>Color del precio</Label>
              <Input
                value={block.props.priceColor}
                onChange={(e) => handleUpdate("priceColor", e.target.value)}
                placeholder="#111827"
              />
            </div>
            <div className="space-y-2">
              <Label>Color del texto</Label>
              <Input
                value={block.props.textColor}
                onChange={(e) => handleUpdate("textColor", e.target.value)}
                placeholder="#6B7280"
              />
            </div>
          </>
        )}

        {block.type === "event" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(value) => handleUpdate("variant", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editorial">Editorial</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                  <SelectItem value="immersive">Immersive</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo de color</Label>
              <Select
                value={block.props.themeMode || "inherit"}
                onValueChange={(value) => handleUpdate("themeMode", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Usar tema de la pagina</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Texto del boton principal</Label>
              <Input
                value={block.props.ticketButtonText}
                onChange={(e) => handleUpdate("ticketButtonText", e.target.value)}
                placeholder="Tickets"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar descripcion</Label>
              <Switch
                checked={block.props.showDescription}
                onCheckedChange={(value) => handleUpdate("showDescription", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar metadata</Label>
              <Switch
                checked={block.props.showMeta}
                onCheckedChange={(value) => handleUpdate("showMeta", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar panel de tickets</Label>
              <Switch
                checked={block.props.showTicketPanel}
                onCheckedChange={(value) => handleUpdate("showTicketPanel", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar invitados</Label>
              <Switch
                checked={block.props.showHosts}
                onCheckedChange={(value) => handleUpdate("showHosts", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar agenda</Label>
              <Switch
                checked={block.props.showSchedule}
                onCheckedChange={(value) => handleUpdate("showSchedule", value)}
              />
            </div>
          </>
        )}

        {block.type === "event-tickets" && (
          <>
            <div className="space-y-2">
              <Label>Evento</Label>
              <EventSelectorSingle
                value={block.props.eventId || null}
                placeholder="Busca un evento de tu cuenta..."
                onChange={(eventId) => handleUpdate("eventId", eventId || "")}
              />
              <Input
                value={block.props.eventId}
                onChange={(e) => handleUpdate("eventId", e.target.value)}
                placeholder="Slug, id o URL del evento"
              />
            </div>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(value) => handleUpdate("variant", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo de color</Label>
              <Select
                value={block.props.themeMode || "inherit"}
                onValueChange={(value) => handleUpdate("themeMode", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Usar tema de la pagina</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Texto del boton</Label>
              <Input
                value={block.props.buttonText}
                onChange={(e) => handleUpdate("buttonText", e.target.value)}
                placeholder="Comprar tickets"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar titulo del evento</Label>
              <Switch
                checked={block.props.showEventTitle}
                onCheckedChange={(value) => handleUpdate("showEventTitle", value)}
              />
            </div>
          </>
        )}

        {block.type === "section" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left Image</SelectItem>
                  <SelectItem value="right">Right Image</SelectItem>
                  <SelectItem value="fixed">Fixed Layout</SelectItem>
                  <SelectItem value="overlay">Overlay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo de color</Label>
              <Select
                value={block.props.themeMode || "inherit"}
                onValueChange={(v) => handleUpdate("themeMode", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Usar tema de la pagina</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={block.props.title}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Section Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input
                value={block.props.subtitle}
                onChange={(e) => handleUpdate("subtitle", e.target.value)}
                placeholder="01"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={block.props.description}
                onChange={(e) => handleUpdate("description", e.target.value)}
                placeholder="<p>Add your section description here...</p>"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Acepta texto o HTML simple.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Imagen</Label>
              <ImageUploader
                value={block.props.image || ""}
                onSuccess={(dataUrl) => handleUpdate("image", dataUrl)}
                onRemove={() => handleUpdate("image", "")}
                aspectRatio={block.props.variant === "overlay" ? "video" : "square"}
              />
            </div>
            <div className="space-y-2">
              <Label>Tamano del titulo</Label>
              <Select
                value={block.props.titleSize}
                onValueChange={(v) => handleUpdate("titleSize", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2xl">Small</SelectItem>
                  <SelectItem value="3xl">Medium</SelectItem>
                  <SelectItem value="4xl">Large</SelectItem>
                  <SelectItem value="5xl">Extra Large</SelectItem>
                  <SelectItem value="6xl">2XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamano del subtitulo</Label>
              <Select
                value={block.props.subtitleSize}
                onValueChange={(v) => handleUpdate("subtitleSize", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5xl">Large</SelectItem>
                  <SelectItem value="6xl">Extra Large</SelectItem>
                  <SelectItem value="7xl">2XL</SelectItem>
                  <SelectItem value="8xl">3XL</SelectItem>
                  <SelectItem value="9xl">4XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamano del texto</Label>
              <Select
                value={block.props.textSize}
                onValueChange={(v) => handleUpdate("textSize", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Small</SelectItem>
                  <SelectItem value="lg">Medium</SelectItem>
                  <SelectItem value="xl">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === "playlist" && (
          <>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select
                value={block.props.platform}
                onValueChange={(v) => handleUpdate("platform", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rauversion">Rauversion</SelectItem>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="soundcloud">SoundCloud</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {block.props.platform === "rauversion" ? "Playlist de Rauversion" : "URL de playlist"}
              </Label>
              {block.props.platform === "rauversion" ? (
                <div className="space-y-2">
                  <PlaylistSelectorSingle
                    value={block.props.url || null}
                    endpoint="/playlists.json"
                    placeholder="Busca una playlist de Rauversion..."
                    onChange={(playlistId) => handleUpdate("url", playlistId ? String(playlistId) : "")}
                  />
                  <Input
                    value={block.props.url}
                    onChange={(e) => handleUpdate("url", e.target.value)}
                    placeholder="ID, slug o /playlists/mi-playlist"
                  />
                </div>
              ) : (
                <Input
                  value={block.props.url}
                  onChange={(e) => handleUpdate("url", e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Altura (px)</Label>
              <Input
                type="number"
                value={block.props.height}
                onChange={(e) => handleUpdate("height", parseInt(e.target.value))}
                min={100}
                max={600}
              />
            </div>
          </>
        )}

        {block.type === "multi-playlist" && (
          <>
            <div className="space-y-2">
              <Label>Playlists de tu cuenta</Label>
              <PlaylistSelectorMulti
                value={block.props.playlistIds || []}
                placeholder="Busca playlists de Rauversion..."
                onChange={(playlistIds) => handleUpdate("playlistIds", playlistIds)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay</Label>
              <Switch
                checked={block.props.autoPlay}
                onCheckedChange={(value) => handleUpdate("autoPlay", value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo (ms)</Label>
              <Input
                type="number"
                value={block.props.interval}
                onChange={(e) => handleUpdate("interval", Number.parseInt(e.target.value, 10) || 5000)}
                min={1000}
                step={500}
              />
            </div>
            <div className="space-y-2">
              <Label>Tamano de items</Label>
              <Select
                value={block.props.itemSize}
                onValueChange={(value) => handleUpdate("itemSize", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsive">Responsive</SelectItem>
                  <SelectItem value="third">Un tercio</SelectItem>
                  <SelectItem value="half">Mitad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orientacion</Label>
              <Select
                value={block.props.orientation}
                onValueChange={(value) => handleUpdate("orientation", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === "track" && (
          <>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select
                value={block.props.platform}
                onValueChange={(v) => handleUpdate("platform", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="soundcloud">SoundCloud</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL del track</Label>
              <Input
                value={block.props.url}
                onChange={(e) => handleUpdate("url", e.target.value)}
                placeholder="https://open.spotify.com/track/..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Compacto</Label>
              <Switch
                checked={block.props.compact}
                onCheckedChange={(v) => handleUpdate("compact", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar artwork</Label>
              <Switch
                checked={block.props.showArtwork}
                onCheckedChange={(v) => handleUpdate("showArtwork", v)}
              />
            </div>
          </>
        )}

        {block.type === "link-embed" && (
          <>
            <div className="space-y-2">
              <Label>Tipo de embed</Label>
              <Select
                value={block.props.embedType}
                onValueChange={(v) => handleUpdate("embedType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="generic">Generico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={block.props.url}
                onChange={(e) => handleUpdate("url", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label>Proporcion</Label>
              <Select
                value={block.props.aspectRatio}
                onValueChange={(v) => handleUpdate("aspectRatio", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video (16:9)</SelectItem>
                  <SelectItem value="square">Cuadrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === "column" && (
          <>
            <div className="space-y-2">
              <Label>Numero de columnas</Label>
              <Select
                value={String(block.props.columns)}
                onValueChange={(v) => handleUpdate("columns", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columnas</SelectItem>
                  <SelectItem value="3">3 columnas</SelectItem>
                  <SelectItem value="4">4 columnas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Espaciado</Label>
              <Select
                value={block.props.gap}
                onValueChange={(v) => handleUpdate("gap", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {block.type === "card" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Vertical)</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="featured">Featured (Hero)</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="glass">Glass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagen</Label>
              <ImageUploader
                value={block.props.image || ""}
                onSuccess={(dataUrl) => handleUpdate("image", dataUrl)}
                onRemove={() => handleUpdate("image", "")}
                aspectRatio="video"
              />
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={block.props.title}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Titulo de la card"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => handleUpdate("subtitle", e.target.value)}
                placeholder="Subtitulo opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={block.props.description || ""}
                onChange={(e) => handleUpdate("description", e.target.value)}
                placeholder="Descripcion de la card..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input
                value={block.props.badge || ""}
                onChange={(e) => handleUpdate("badge", e.target.value)}
                placeholder="Nuevo, Destacado, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Enlace</Label>
              <Input
                value={block.props.link || ""}
                onChange={(e) => handleUpdate("link", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto del enlace</Label>
              <Input
                value={block.props.linkText || ""}
                onChange={(e) => handleUpdate("linkText", e.target.value)}
                placeholder="Ver mas"
              />
            </div>
          </>
        )}

        {block.type === "carousel" && (
          <>
            <div className="space-y-2">
              <Label>Slides por vista</Label>
              <Select
                value={String(block.props.slidesPerView)}
                onValueChange={(v) => handleUpdate("slidesPerView", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 slide</SelectItem>
                  <SelectItem value="2">2 slides</SelectItem>
                  <SelectItem value="3">3 slides</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Espaciado</Label>
              <Select
                value={block.props.gap}
                onValueChange={(v) => handleUpdate("gap", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar flechas</Label>
              <Switch
                checked={block.props.showArrows}
                onCheckedChange={(v) => handleUpdate("showArrows", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar puntos</Label>
              <Switch
                checked={block.props.showDots}
                onCheckedChange={(v) => handleUpdate("showDots", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Loop infinito</Label>
              <Switch
                checked={block.props.loop}
                onCheckedChange={(v) => handleUpdate("loop", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay</Label>
              <Switch
                checked={block.props.autoplay}
                onCheckedChange={(v) => handleUpdate("autoplay", v)}
              />
            </div>
            {block.props.autoplay && (
              <div className="space-y-2">
                <Label>Delay autoplay (ms)</Label>
                <Input
                  type="number"
                  value={block.props.autoplayDelay}
                  onChange={(e) => handleUpdate("autoplayDelay", parseInt(e.target.value))}
                  min={1000}
                  max={10000}
                  step={500}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Añade bloques a cada slide haciendo clic en el boton dentro del carousel
            </p>
          </>
        )}

        {block.type === "button" && (
          <>
            <div className="space-y-2">
              <Label>Texto del boton</Label>
              <Input
                value={block.props.text}
                onChange={(e) => handleUpdate("text", e.target.value)}
                placeholder="Click aqui"
              />
            </div>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="glow">Glow</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                  <SelectItem value="3d">3D</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamano</Label>
              <Select
                value={block.props.size}
                onValueChange={(v) => handleUpdate("size", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Extra grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enlace</Label>
              <Input
                value={block.props.href}
                onChange={(e) => handleUpdate("href", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <Select
                value={block.props.icon || "none"}
                onValueChange={(v) => handleUpdate("icon", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin icono</SelectItem>
                  <SelectItem value="arrow-right">Flecha derecha</SelectItem>
                  <SelectItem value="external-link">Link externo</SelectItem>
                  <SelectItem value="play">Play</SelectItem>
                  <SelectItem value="download">Descarga</SelectItem>
                  <SelectItem value="music">Musica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {block.props.icon && block.props.icon !== "none" && (
              <div className="space-y-2">
                <Label>Posicion del icono</Label>
                <Select
                  value={block.props.iconPosition}
                  onValueChange={(v) => handleUpdate("iconPosition", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Izquierda</SelectItem>
                    <SelectItem value="right">Derecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select
                value={block.props.alignment}
                onValueChange={(v) => handleUpdate("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Ancho completo</Label>
              <Switch
                checked={block.props.fullWidth}
                onCheckedChange={(v) => handleUpdate("fullWidth", v)}
              />
            </div>
          </>
        )}

        {block.type === "custom-player" && (
          <>
            <div className="space-y-2">
              <Label>Artwork URL</Label>
              <Input
                value={block.props.artwork}
                onChange={(e) => handleUpdate("artwork", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Color de acento</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.props.accentColor}
                  onChange={(e) => handleUpdate("accentColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={block.props.accentColor}
                  onChange={(e) => handleUpdate("accentColor", e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tracks</Label>
              <p className="text-xs text-muted-foreground">
                Anade tracks mediante la configuracion avanzada
              </p>
            </div>
          </>
        )}

        {block.type === "hero" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centered">Centrado</SelectItem>
                  <SelectItem value="split">Dividido</SelectItem>
                  <SelectItem value="background">Fondo completo</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="album">Album</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={block.props.title}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Titulo principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input
                value={block.props.subtitle}
                onChange={(e) => handleUpdate("subtitle", e.target.value)}
                placeholder="Subtitulo"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={block.props.description || ""}
                onChange={(e) => handleUpdate("description", e.target.value)}
                placeholder="Descripcion opcional..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagen de fondo</Label>
              <ImageUploader
                value={block.props.backgroundImage || ""}
                onSuccess={(dataUrl) => handleUpdate("backgroundImage", dataUrl)}
                onRemove={() => handleUpdate("backgroundImage", "")}
                aspectRatio="video"
              />
            </div>
            <div className="space-y-2">
              <Label>Opacidad overlay ({block.props.overlayOpacity}%)</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={block.props.overlayOpacity}
                onChange={(e) => handleUpdate("overlayOpacity", parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select
                value={block.props.alignment}
                onValueChange={(v) => handleUpdate("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Altura</Label>
              <Select
                value={block.props.height}
                onValueChange={(v) => handleUpdate("height", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="medium">Mediana</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="screen">Pantalla completa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Texto CTA principal</Label>
              <Input
                value={block.props.ctaText || ""}
                onChange={(e) => handleUpdate("ctaText", e.target.value)}
                placeholder="Escuchar ahora"
              />
            </div>
            <div className="space-y-2">
              <Label>Link CTA principal</Label>
              <Input
                value={block.props.ctaLink || ""}
                onChange={(e) => handleUpdate("ctaLink", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto CTA secundario</Label>
              <Input
                value={block.props.secondaryCtaText || ""}
                onChange={(e) => handleUpdate("secondaryCtaText", e.target.value)}
                placeholder="Mas info"
              />
            </div>
            <div className="space-y-2">
              <Label>Link CTA secundario</Label>
              <Input
                value={block.props.secondaryCtaLink || ""}
                onChange={(e) => handleUpdate("secondaryCtaLink", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </>
        )}

        {block.type === "headline" && (
          <>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                value={block.props.text}
                onChange={(e) => handleUpdate("text", e.target.value)}
                placeholder="Titulo principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="highlight">Highlight</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                  <SelectItem value="animated">Animado</SelectItem>
                  <SelectItem value="decorative">Decorativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamano</Label>
              <Select
                value={block.props.size}
                onValueChange={(v) => handleUpdate("size", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Extra grande</SelectItem>
                  <SelectItem value="2xl">Enorme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => handleUpdate("subtitle", e.target.value)}
                placeholder="Subtitulo opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Tag HTML</Label>
              <Select
                value={block.props.tag}
                onValueChange={(v) => handleUpdate("tag", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select
                value={block.props.alignment}
                onValueChange={(v) => handleUpdate("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Animar</Label>
              <Switch
                checked={block.props.animate}
                onCheckedChange={(v) => handleUpdate("animate", v)}
              />
            </div>
          </>
        )}

        {block.type === "countdown" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="flip">Flip</SelectItem>
                  <SelectItem value="circles">Circulos</SelectItem>
                  <SelectItem value="neon">Neon</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha objetivo</Label>
              <Input
                type="datetime-local"
                value={block.props.targetDate ? new Date(block.props.targetDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => handleUpdate("targetDate", new Date(e.target.value).toISOString())}
              />
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Lanzamiento en"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input
                value={block.props.subtitle || ""}
                onChange={(e) => handleUpdate("subtitle", e.target.value)}
                placeholder="Opcional..."
              />
            </div>
            <div className="space-y-2">
              <Label>Mensaje al expirar</Label>
              <Input
                value={block.props.expiredMessage}
                onChange={(e) => handleUpdate("expiredMessage", e.target.value)}
                placeholder="Ya disponible!"
              />
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select
                value={block.props.alignment}
                onValueChange={(v) => handleUpdate("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Mostrar unidades</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dias</span>
                  <Switch
                    checked={block.props.showDays}
                    onCheckedChange={(v) => handleUpdate("showDays", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Horas</span>
                  <Switch
                    checked={block.props.showHours}
                    onCheckedChange={(v) => handleUpdate("showHours", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Minutos</span>
                  <Switch
                    checked={block.props.showMinutes}
                    onCheckedChange={(v) => handleUpdate("showMinutes", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Segundos</span>
                  <Switch
                    checked={block.props.showSeconds}
                    onCheckedChange={(v) => handleUpdate("showSeconds", v)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {block.type === "social-links" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icons">Iconos</SelectItem>
                  <SelectItem value="buttons">Botones</SelectItem>
                  <SelectItem value="pills">Pills</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="floating">Flotante</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamano</Label>
              <Select
                value={block.props.size}
                onValueChange={(v) => handleUpdate("size", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select
                value={block.props.alignment}
                onValueChange={(v) => handleUpdate("alignment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar etiquetas</Label>
              <Switch
                checked={block.props.showLabels}
                onCheckedChange={(v) => handleUpdate("showLabels", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Titulo (opcional)</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Escuchar en"
              />
            </div>
            
            {/* Social Links Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Links ({block.props.links.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newLink: SocialLink = {
                      id: nanoid(),
                      platform: "spotify",
                      url: "",
                    }
                    handleUpdate("links", [...block.props.links, newLink])
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3 pr-2">
                  {block.props.links.map((link: SocialLink, index: number) => (
                    <div 
                      key={link.id} 
                      className="p-3 border rounded-lg space-y-2 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const newLinks = block.props.links.filter(
                              (l: SocialLink) => l.id !== link.id
                            )
                            handleUpdate("links", newLinks)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Select
                        value={link.platform}
                        onValueChange={(v: SocialPlatform) => {
                          const newLinks = block.props.links.map((l: SocialLink) =>
                            l.id === link.id ? { ...l, platform: v } : l
                          )
                          handleUpdate("links", newLinks)
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spotify">Spotify</SelectItem>
                          <SelectItem value="apple-music">Apple Music</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="soundcloud">SoundCloud</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">X / Twitter</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="bandcamp">Bandcamp</SelectItem>
                          <SelectItem value="deezer">Deezer</SelectItem>
                          <SelectItem value="amazon-music">Amazon Music</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = block.props.links.map((l: SocialLink) =>
                            l.id === link.id ? { ...l, url: e.target.value } : l
                          )
                          handleUpdate("links", newLinks)
                        }}
                        placeholder="https://..."
                        className="h-8"
                      />
                      {block.props.showLabels && (
                        <Input
                          value={link.label || ""}
                          onChange={(e) => {
                            const newLinks = block.props.links.map((l: SocialLink) =>
                              l.id === link.id ? { ...l, label: e.target.value } : l
                            )
                            handleUpdate("links", newLinks)
                          }}
                          placeholder="Etiqueta personalizada"
                          className="h-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "tour-dates" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select
                value={block.props.variant}
                onValueChange={(v) => handleUpdate("variant", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="featured">Destacado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input
                value={block.props.title || ""}
                onChange={(e) => handleUpdate("title", e.target.value)}
                placeholder="Proximas fechas"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto del boton</Label>
              <Input
                value={block.props.ticketButtonText}
                onChange={(e) => handleUpdate("ticketButtonText", e.target.value)}
                placeholder="Tickets"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensaje sin fechas</Label>
              <Input
                value={block.props.emptyMessage}
                onChange={(e) => handleUpdate("emptyMessage", e.target.value)}
                placeholder="No hay fechas programadas"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar fechas pasadas</Label>
              <Switch
                checked={block.props.showPastDates}
                onCheckedChange={(v) => handleUpdate("showPastDates", v)}
              />
            </div>

            {/* Tour Dates Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fechas ({block.props.dates.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate: TourDate = {
                      id: nanoid(),
                      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                      venue: "",
                      city: "",
                      country: "",
                      ticketUrl: "",
                      soldOut: false,
                    }
                    handleUpdate("dates", [...block.props.dates, newDate])
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar fecha
                </Button>
              </div>

              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3 pr-2">
                  {block.props.dates.map((tourDate: TourDate, index: number) => (
                    <div 
                      key={tourDate.id} 
                      className="p-3 border rounded-lg space-y-2 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          {tourDate.soldOut && (
                            <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">
                              Sold Out
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const newDates = block.props.dates.filter(
                              (d: TourDate) => d.id !== tourDate.id
                            )
                            handleUpdate("dates", newDates)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          type="datetime-local"
                          value={tourDate.date ? new Date(tourDate.date).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            const newDates = block.props.dates.map((d: TourDate) =>
                              d.id === tourDate.id 
                                ? { ...d, date: new Date(e.target.value).toISOString() } 
                                : d
                            )
                            handleUpdate("dates", newDates)
                          }}
                          className="h-8"
                        />
                        <Input
                          value={tourDate.venue}
                          onChange={(e) => {
                            const newDates = block.props.dates.map((d: TourDate) =>
                              d.id === tourDate.id ? { ...d, venue: e.target.value } : d
                            )
                            handleUpdate("dates", newDates)
                          }}
                          placeholder="Venue"
                          className="h-8"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={tourDate.city}
                            onChange={(e) => {
                              const newDates = block.props.dates.map((d: TourDate) =>
                                d.id === tourDate.id ? { ...d, city: e.target.value } : d
                              )
                              handleUpdate("dates", newDates)
                            }}
                            placeholder="Ciudad"
                            className="h-8"
                          />
                          <Input
                            value={tourDate.country}
                            onChange={(e) => {
                              const newDates = block.props.dates.map((d: TourDate) =>
                                d.id === tourDate.id ? { ...d, country: e.target.value } : d
                              )
                              handleUpdate("dates", newDates)
                            }}
                            placeholder="Pais"
                            className="h-8"
                          />
                        </div>
                        <Input
                          value={tourDate.ticketUrl || ""}
                          onChange={(e) => {
                            const newDates = block.props.dates.map((d: TourDate) =>
                              d.id === tourDate.id ? { ...d, ticketUrl: e.target.value } : d
                            )
                            handleUpdate("dates", newDates)
                          }}
                          placeholder="URL de tickets"
                          className="h-8"
                        />
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">Agotado</span>
                          <Switch
                            checked={tourDate.soldOut}
                            onCheckedChange={(v) => {
                              const newDates = block.props.dates.map((d: TourDate) =>
                                d.id === tourDate.id ? { ...d, soldOut: v } : d
                              )
                              handleUpdate("dates", newDates)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "video-background" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fullscreen">Pantalla completa</SelectItem>
                  <SelectItem value="contained">Contenido</SelectItem>
                  <SelectItem value="parallax">Parallax</SelectItem>
                  <SelectItem value="split">Dividido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL del video</Label>
              <Input value={block.props.videoUrl} onChange={(e) => handleUpdate("videoUrl", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Imagen poster</Label>
              <ImageUploader value={block.props.posterImage || ""} onSuccess={(url) => handleUpdate("posterImage", url)} onRemove={() => handleUpdate("posterImage", "")} aspectRatio="video" />
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={block.props.title || ""} onChange={(e) => handleUpdate("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input value={block.props.subtitle || ""} onChange={(e) => handleUpdate("subtitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Altura</Label>
              <Select value={block.props.height} onValueChange={(v) => handleUpdate("height", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen">Pantalla completa</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="medium">Mediano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opacidad overlay ({block.props.overlayOpacity}%)</Label>
              <Input type="range" min={0} max={100} value={block.props.overlayOpacity} onChange={(e) => handleUpdate("overlayOpacity", parseInt(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay</Label>
              <Switch checked={block.props.autoplay} onCheckedChange={(v) => handleUpdate("autoplay", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Loop</Label>
              <Switch checked={block.props.loop} onCheckedChange={(v) => handleUpdate("loop", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Silenciado</Label>
              <Switch checked={block.props.muted} onCheckedChange={(v) => handleUpdate("muted", v)} />
            </div>
          </>
        )}

        {block.type === "gallery" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Columnas</Label>
              <Select value={String(block.props.columns)} onValueChange={(v) => handleUpdate("columns", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columnas</SelectItem>
                  <SelectItem value="3">3 columnas</SelectItem>
                  <SelectItem value="4">4 columnas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar captions</Label>
              <Switch checked={block.props.showCaptions} onCheckedChange={(v) => handleUpdate("showCaptions", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Lightbox</Label>
              <Switch checked={block.props.lightbox} onCheckedChange={(v) => handleUpdate("lightbox", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Imagenes ({block.props.images.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newImage: GalleryImage = { id: nanoid(), src: "", alt: "", caption: "" }
                  handleUpdate("images", [...block.props.images, newImage])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {block.props.images.map((img: GalleryImage, index: number) => (
                    <div key={img.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Imagen {index + 1}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          handleUpdate("images", block.props.images.filter((i: GalleryImage) => i.id !== img.id))
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <ImageUploader value={img.src} onSuccess={(url) => {
                        const updated = block.props.images.map((i: GalleryImage) => i.id === img.id ? { ...i, src: url } : i)
                        handleUpdate("images", updated)
                      }} onRemove={() => {
                        const updated = block.props.images.map((i: GalleryImage) => i.id === img.id ? { ...i, src: "" } : i)
                        handleUpdate("images", updated)
                      }} aspectRatio="square" />
                      <Input placeholder="Texto alt" value={img.alt} onChange={(e) => {
                        const updated = block.props.images.map((i: GalleryImage) => i.id === img.id ? { ...i, alt: e.target.value } : i)
                        handleUpdate("images", updated)
                      }} className="h-8" />
                      <Input placeholder="Caption (opcional)" value={img.caption || ""} onChange={(e) => {
                        const updated = block.props.images.map((i: GalleryImage) => i.id === img.id ? { ...i, caption: e.target.value } : i)
                        handleUpdate("images", updated)
                      }} className="h-8" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "marquee" && (
          <>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input value={block.props.text} onChange={(e) => handleUpdate("text", e.target.value)} placeholder="NUEVO ALBUM DISPONIBLE" />
            </div>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="outlined">Outline</SelectItem>
                  <SelectItem value="mixed">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamano</Label>
              <Select value={block.props.size} onValueChange={(v) => handleUpdate("size", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Extra grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Velocidad</Label>
              <Select value={block.props.speed} onValueChange={(v) => handleUpdate("speed", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Lento</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Rapido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direccion</Label>
              <Select value={block.props.direction} onValueChange={(v) => handleUpdate("direction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Separador</Label>
              <Input value={block.props.separator || ""} onChange={(e) => handleUpdate("separator", e.target.value)} placeholder="•" />
            </div>
            <div className="space-y-2">
              <Label>Repeticiones</Label>
              <Input type="number" min={2} max={10} value={block.props.repeat} onChange={(e) => handleUpdate("repeat", parseInt(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Pausar al hover</Label>
              <Switch checked={block.props.pauseOnHover} onCheckedChange={(v) => handleUpdate("pauseOnHover", v)} />
            </div>
          </>
        )}

        {block.type === "divider" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linea</SelectItem>
                  <SelectItem value="dashed">Guiones</SelectItem>
                  <SelectItem value="dotted">Puntos</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="wave">Onda</SelectItem>
                  <SelectItem value="zigzag">Zigzag</SelectItem>
                  <SelectItem value="ornament">Ornamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grosor</Label>
              <Select value={block.props.thickness} onValueChange={(v) => handleUpdate("thickness", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="thin">Fino</SelectItem>
                  <SelectItem value="medium">Mediano</SelectItem>
                  <SelectItem value="thick">Grueso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ancho</Label>
              <Select value={block.props.width} onValueChange={(v) => handleUpdate("width", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Completo</SelectItem>
                  <SelectItem value="medium">Mediano</SelectItem>
                  <SelectItem value="short">Corto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Espaciado</Label>
              <Select value={block.props.spacing} onValueChange={(v) => handleUpdate("spacing", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Mediano</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Extra grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color (opcional)</Label>
              <Input type="color" value={block.props.color || "#ffffff"} onChange={(e) => handleUpdate("color", e.target.value)} />
            </div>
          </>
        )}

        {block.type === "credits" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="columns">Columnas</SelectItem>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="detailed">Detallado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={block.props.title || ""} onChange={(e) => handleUpdate("title", e.target.value)} placeholder="Creditos" />
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select value={block.props.alignment} onValueChange={(v) => handleUpdate("alignment", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Creditos ({block.props.credits.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newCredit: Credit = { id: nanoid(), role: "", name: "" }
                  handleUpdate("credits", [...block.props.credits, newCredit])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {block.props.credits.map((credit: Credit) => (
                    <div key={credit.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input value={credit.role} onChange={(e) => {
                          const updated = block.props.credits.map((c: Credit) => c.id === credit.id ? { ...c, role: e.target.value } : c)
                          handleUpdate("credits", updated)
                        }} placeholder="Rol" className="h-8" />
                        <Input value={credit.name} onChange={(e) => {
                          const updated = block.props.credits.map((c: Credit) => c.id === credit.id ? { ...c, name: e.target.value } : c)
                          handleUpdate("credits", updated)
                        }} placeholder="Nombre" className="h-8" />
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                        handleUpdate("credits", block.props.credits.filter((c: Credit) => c.id !== credit.id))
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "press-quotes" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar ratings</Label>
              <Switch checked={block.props.showRatings} onCheckedChange={(v) => handleUpdate("showRatings", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay (slider)</Label>
              <Switch checked={block.props.autoplay} onCheckedChange={(v) => handleUpdate("autoplay", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quotes ({block.props.quotes.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newQuote: PressQuote = { id: nanoid(), quote: "", source: "", rating: 5 }
                  handleUpdate("quotes", [...block.props.quotes, newQuote])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {block.props.quotes.map((quote: PressQuote) => (
                    <div key={quote.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Quote</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          handleUpdate("quotes", block.props.quotes.filter((q: PressQuote) => q.id !== quote.id))
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea value={quote.quote} onChange={(e) => {
                        const updated = block.props.quotes.map((q: PressQuote) => q.id === quote.id ? { ...q, quote: e.target.value } : q)
                        handleUpdate("quotes", updated)
                      }} placeholder="Quote..." rows={2} />
                      <Input value={quote.source} onChange={(e) => {
                        const updated = block.props.quotes.map((q: PressQuote) => q.id === quote.id ? { ...q, source: e.target.value } : q)
                        handleUpdate("quotes", updated)
                      }} placeholder="Fuente" className="h-8" />
                      <Input type="number" min={1} max={5} value={quote.rating || 5} onChange={(e) => {
                        const updated = block.props.quotes.map((q: PressQuote) => q.id === quote.id ? { ...q, rating: parseInt(e.target.value) } : q)
                        handleUpdate("quotes", updated)
                      }} className="h-8" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "stats" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="inline">Inline</SelectItem>
                  <SelectItem value="circles">Circulos</SelectItem>
                  <SelectItem value="counters">Counters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Columnas</Label>
              <Select value={String(block.props.columns)} onValueChange={(v) => handleUpdate("columns", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columnas</SelectItem>
                  <SelectItem value="3">3 columnas</SelectItem>
                  <SelectItem value="4">4 columnas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Animar numeros</Label>
              <Switch checked={block.props.animate} onCheckedChange={(v) => handleUpdate("animate", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Stats ({block.props.stats.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newStat: Stat = { id: nanoid(), value: "0", label: "" }
                  handleUpdate("stats", [...block.props.stats, newStat])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {block.props.stats.map((stat: Stat) => (
                    <div key={stat.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input value={stat.value} onChange={(e) => {
                          const updated = block.props.stats.map((s: Stat) => s.id === stat.id ? { ...s, value: e.target.value } : s)
                          handleUpdate("stats", updated)
                        }} placeholder="Valor (ej: 1M)" className="h-8" />
                        <Input value={stat.label} onChange={(e) => {
                          const updated = block.props.stats.map((s: Stat) => s.id === stat.id ? { ...s, label: e.target.value } : s)
                          handleUpdate("stats", updated)
                        }} placeholder="Label" className="h-8" />
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                        handleUpdate("stats", block.props.stats.filter((s: Stat) => s.id !== stat.id))
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "discography" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={block.props.title || ""} onChange={(e) => handleUpdate("title", e.target.value)} placeholder="Discografia" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar ano</Label>
              <Switch checked={block.props.showYear} onCheckedChange={(v) => handleUpdate("showYear", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar tipo</Label>
              <Switch checked={block.props.showType} onCheckedChange={(v) => handleUpdate("showType", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Albums ({block.props.albums.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newAlbum: Album = { id: nanoid(), title: "", year: new Date().getFullYear().toString(), cover: "", type: "album" }
                  handleUpdate("albums", [...block.props.albums, newAlbum])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {block.props.albums.map((album: Album) => (
                    <div key={album.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Album</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          handleUpdate("albums", block.props.albums.filter((a: Album) => a.id !== album.id))
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <ImageUploader value={album.cover} onSuccess={(url) => {
                        const updated = block.props.albums.map((a: Album) => a.id === album.id ? { ...a, cover: url } : a)
                        handleUpdate("albums", updated)
                      }} onRemove={() => {
                        const updated = block.props.albums.map((a: Album) => a.id === album.id ? { ...a, cover: "" } : a)
                        handleUpdate("albums", updated)
                      }} aspectRatio="square" />
                      <Input value={album.title} onChange={(e) => {
                        const updated = block.props.albums.map((a: Album) => a.id === album.id ? { ...a, title: e.target.value } : a)
                        handleUpdate("albums", updated)
                      }} placeholder="Titulo" className="h-8" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={album.year} onChange={(e) => {
                          const updated = block.props.albums.map((a: Album) => a.id === album.id ? { ...a, year: e.target.value } : a)
                          handleUpdate("albums", updated)
                        }} placeholder="Ano" className="h-8" />
                        <Select value={album.type} onValueChange={(v) => {
                          const updated = block.props.albums.map((a: Album) => a.id === album.id ? { ...a, type: v as Album["type"] } : a)
                          handleUpdate("albums", updated)
                        }}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="album">Album</SelectItem>
                            <SelectItem value="ep">EP</SelectItem>
                            <SelectItem value="single">Single</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input value={album.link || ""} onChange={(e) => {
                        const updated = block.props.albums.map((a: Album) => a.id === album.id ? { ...a, link: e.target.value } : a)
                        handleUpdate("albums", updated)
                      }} placeholder="Link (opcional)" className="h-8" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "bio-card" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="centered">Centrado</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagen</Label>
              <ImageUploader value={block.props.image || ""} onSuccess={(url) => handleUpdate("image", url)} onRemove={() => handleUpdate("image", "")} aspectRatio="square" />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={block.props.name} onChange={(e) => handleUpdate("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Input value={block.props.role || ""} onChange={(e) => handleUpdate("role", e.target.value)} placeholder="Artista / Productor" />
            </div>
            <div className="space-y-2">
              <Label>Biografia</Label>
              <Textarea value={block.props.bio} onChange={(e) => handleUpdate("bio", e.target.value)} rows={4} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar redes</Label>
              <Switch checked={block.props.showSocials} onCheckedChange={(v) => handleUpdate("showSocials", v)} />
            </div>
          </>
        )}

        {block.type === "accordion" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bordered">Bordered</SelectItem>
                  <SelectItem value="separated">Separated</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Permitir multiples abiertos</Label>
              <Switch checked={block.props.allowMultiple} onCheckedChange={(v) => handleUpdate("allowMultiple", v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items ({block.props.items.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newItem: AccordionItem = { id: nanoid(), title: "", content: "" }
                  handleUpdate("items", [...block.props.items, newItem])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {block.props.items.map((item: AccordionItem) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Item</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          handleUpdate("items", block.props.items.filter((i: AccordionItem) => i.id !== item.id))
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input value={item.title} onChange={(e) => {
                        const updated = block.props.items.map((i: AccordionItem) => i.id === item.id ? { ...i, title: e.target.value } : i)
                        handleUpdate("items", updated)
                      }} placeholder="Titulo" className="h-8" />
                      <Textarea value={item.content} onChange={(e) => {
                        const updated = block.props.items.map((i: AccordionItem) => i.id === item.id ? { ...i, content: e.target.value } : i)
                        handleUpdate("items", updated)
                      }} placeholder="Contenido" rows={2} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "tabs" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="pills">Pills</SelectItem>
                  <SelectItem value="underline">Underline</SelectItem>
                  <SelectItem value="bordered">Bordered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alineacion</Label>
              <Select value={block.props.alignment} onValueChange={(v) => handleUpdate("alignment", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tabs ({block.props.items.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newTab: TabItem = { id: nanoid(), label: "", content: "" }
                  handleUpdate("items", [...block.props.items, newTab])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {block.props.items.map((tab: TabItem) => (
                    <div key={tab.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Tab</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          handleUpdate("items", block.props.items.filter((t: TabItem) => t.id !== tab.id))
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input value={tab.label} onChange={(e) => {
                        const updated = block.props.items.map((t: TabItem) => t.id === tab.id ? { ...t, label: e.target.value } : t)
                        handleUpdate("items", updated)
                      }} placeholder="Label" className="h-8" />
                      <Textarea value={tab.content} onChange={(e) => {
                        const updated = block.props.items.map((t: TabItem) => t.id === tab.id ? { ...t, content: e.target.value } : t)
                        handleUpdate("items", updated)
                      }} placeholder="Contenido" rows={2} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {block.type === "merch-grid" && (
          <>
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={block.props.variant} onValueChange={(v) => handleUpdate("variant", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input value={block.props.title || ""} onChange={(e) => handleUpdate("title", e.target.value)} placeholder="Merch" />
            </div>
            <div className="space-y-2">
              <Label>Columnas</Label>
              <Select value={String(block.props.columns)} onValueChange={(v) => handleUpdate("columns", parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 columnas</SelectItem>
                  <SelectItem value="3">3 columnas</SelectItem>
                  <SelectItem value="4">4 columnas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar precios</Label>
              <Switch checked={block.props.showPrices} onCheckedChange={(v) => handleUpdate("showPrices", v)} />
            </div>
            <div className="space-y-2">
              <Label>Texto del boton</Label>
              <Input value={block.props.buttonText} onChange={(e) => handleUpdate("buttonText", e.target.value)} placeholder="Comprar" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Productos ({block.props.items.length})</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newItem: MerchItem = { id: nanoid(), name: "", price: "", image: "", link: "", soldOut: false }
                  handleUpdate("items", [...block.props.items, newItem])
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {block.props.items.map((item: MerchItem) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Producto</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          handleUpdate("items", block.props.items.filter((i: MerchItem) => i.id !== item.id))
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <ImageUploader value={item.image} onSuccess={(url) => {
                        const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, image: url } : i)
                        handleUpdate("items", updated)
                      }} onRemove={() => {
                        const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, image: "" } : i)
                        handleUpdate("items", updated)
                      }} aspectRatio="square" />
                      <Input value={item.name} onChange={(e) => {
                        const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, name: e.target.value } : i)
                        handleUpdate("items", updated)
                      }} placeholder="Nombre" className="h-8" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={item.price} onChange={(e) => {
                          const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, price: e.target.value } : i)
                          handleUpdate("items", updated)
                        }} placeholder="Precio" className="h-8" />
                        <Input value={item.badge || ""} onChange={(e) => {
                          const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, badge: e.target.value } : i)
                          handleUpdate("items", updated)
                        }} placeholder="Badge" className="h-8" />
                      </div>
                      <Input value={item.link} onChange={(e) => {
                        const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, link: e.target.value } : i)
                        handleUpdate("items", updated)
                      }} placeholder="Link de compra" className="h-8" />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">Agotado</span>
                        <Switch checked={item.soldOut} onCheckedChange={(v) => {
                          const updated = block.props.items.map((i: MerchItem) => i.id === item.id ? { ...i, soldOut: v } : i)
                          handleUpdate("items", updated)
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => onRemove(block.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar bloque
        </Button>
      </div>
    </div>
  )
}
