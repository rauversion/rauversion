"use client"
import React from "react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { post } from "@rails/request.js"
import { ChromePicker } from "react-color"
import * as Popover from "@radix-ui/react-popover"

function HeroImageUploader({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string
  onChange: (url: string) => void
  label: string
  disabled?: boolean
}) {
  const [uploading, setUploading] = React.useState(false)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await post("/releases/upload_puck_image.json", {
        body: formData,
        responseKind: "json",
        contentType: false
      })
      // @ts-ignore
      const data = await response.json
      if (data && data.url) {
        onChange(data.url)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }
  return (
    <div>
      <Label>{label}</Label>
      <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block">
        Upload
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || disabled}
        />
      </label>
      {value && (
        <img src={value} alt={label} className="mt-2 rounded w-full max-w-xs" />
      )}
    </div>
  )
}

export const heroBlock: BlockDefinition = {
  type: "hero",
  label: "Hero",
  icon: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <rect x="2" y="6" width="20" height="12" rx="3" fill="currentColor" opacity="0.2"/>
      <rect x="2" y="6" width="20" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  defaultProperties: {
    title: "Welcome to Our Site",
    description: "This is a sample hero section. Customize it to match your needs.",
    backgroundImage: "",
    overlayColor: "rgba(0,0,0,0.5)",
    height: "h-96",
    align: "left",
    titleColor: "#111111",
    descriptionColor: "#444444",
    image: {
      url: "",
      mode: "side"
    },
    buttons: [
      {
        label: "Get Started",
        href: "#",
        variant: "primary",
        size: "large"
      },
      {
        label: "Learn More",
        href: "#",
        variant: "secondary",
        size: "large"
      }
    ]
  },

  render: ({ block }: BlockRendererProps) => {
    const {
      title,
      description,
      backgroundImage,
      overlayColor,
      height,
      align,
      image = {},
      buttons = []
    } = block.properties

    const getClassName = (element: string) => {
      let base = {
        content: "relative z-10 container mx-auto px-4 py-12 flex flex-col",
        subtitle: "mt-4 text-lg text-gray-600 max-w-2xl",
        actions: "mt-8 flex gap-4"
      }
      if (align === "center") {
        base.content += " items-center text-center"
        base.subtitle += " text-center"
        base.actions += " justify-center"
      }
      return base[element as keyof typeof base]
    }

    return (
      <div
        className={cn("relative", height)}
        style={{
          backgroundImage: image?.mode === "background"
            ? `url(${image?.url})`
            : backgroundImage
              ? `url(${backgroundImage})`
              : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor }}
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="w-full flex gap-8">
            <div className={getClassName("content")}>
              <h1
                className="text-4xl font-bold"
                style={{ color: block.properties.titleColor || "#111111" }}
              >
                {title}
              </h1>
              <div
                className={getClassName("subtitle")}
                style={{ color: block.properties.descriptionColor || "#444444" }}
              >
                <div dangerouslySetInnerHTML={{ __html: description }} />
              </div>
              <div className={getClassName("actions")}>
                {Array.isArray(buttons) && buttons.map((button: any, i: number) => (
                  <Button
                    key={i}
                    asChild
                    variant={button.variant === "secondary" ? "outline" : "default"}
                    size={button.size === "small" ? "sm" : button.size === "large" ? "lg" : "md"}
                  >
                    <a href={button.href || "#"}>{button.label}</a>
                  </Button>
                ))}
              </div>
            </div>
            {align !== "center" && image?.mode !== "background" && image?.url && (
              <div
                style={{
                  backgroundImage: `url('${image?.url}')`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  borderRadius: 24,
                  height: 356,
                  marginLeft: "auto",
                  width: "100%",
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  },

  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => {
    // Button array editor
    const handleButtonChange = (idx: number, field: string, value: string) => {
      const updated = [...(properties.buttons || [])]
      updated[idx] = { ...updated[idx], [field]: value }
      onChange("buttons", updated)
    }
    const handleAddButton = () => {
      onChange("buttons", [
        ...(properties.buttons || []),
        { label: "", href: "", variant: "primary", size: "large" }
      ])
    }
    const handleRemoveButton = (idx: number) => {
      onChange("buttons", (properties.buttons || []).filter((_: any, i: number) => i !== idx))
    }

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="hero-title">Title</Label>
          <Input
            id="hero-title"
            value={properties.title || ""}
            onChange={e => onChange("title", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="hero-description">Description (HTML allowed)</Label>
          <Textarea
            id="hero-description"
            value={properties.description || ""}
            onChange={e => onChange("description", e.target.value)}
            rows={4}
          />
        </div>
        <HeroImageUploader
          value={properties.backgroundImage}
          onChange={url => onChange("backgroundImage", url)}
          label="Background Image"
        />
        <div className="flex gap-4">
          <div>
            <Label htmlFor="hero-title-color">Title Color</Label>
            <div className="flex items-center gap-2">
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Pick color"
                    className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                    style={{
                      background: properties.titleColor || "#111111",
                    }}
                  />
                </Popover.Trigger>
                <Popover.Content
                  side="right"
                  align="start"
                  className="z-50 bg-white rounded shadow-lg p-2"
                  sideOffset={8}
                >
                  <ChromePicker
                    color={properties.titleColor || "#111111"}
                    onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                      const { r, g, b, a } = color.rgb
                      const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                      onChange("titleColor", value)
                    }}
                    styles={{
                      default: {
                        picker: {
                          width: "180px",
                          boxShadow: "none",
                        },
                      },
                    }}
                  />
                </Popover.Content>
              </Popover.Root>
              <Input
                id="hero-title-color"
                value={properties.titleColor || "#111111"}
                onChange={e => onChange("titleColor", e.target.value)}
                placeholder="#111111"
                type="text"
                className="w-24"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="hero-description-color">Description Color</Label>
            <div className="flex items-center gap-2">
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Pick color"
                    className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                    style={{
                      background: properties.descriptionColor || "#444444",
                    }}
                  />
                </Popover.Trigger>
                <Popover.Content
                  side="right"
                  align="start"
                  className="z-50 bg-white rounded shadow-lg p-2"
                  sideOffset={8}
                >
                  <ChromePicker
                    color={properties.descriptionColor || "#444444"}
                    onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                      const { r, g, b, a } = color.rgb
                      const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                      onChange("descriptionColor", value)
                    }}
                    styles={{
                      default: {
                        picker: {
                          width: "180px",
                          boxShadow: "none",
                        },
                      },
                    }}
                  />
                </Popover.Content>
              </Popover.Root>
              <Input
                id="hero-description-color"
                value={properties.descriptionColor || "#444444"}
                onChange={e => onChange("descriptionColor", e.target.value)}
                placeholder="#444444"
                type="text"
                className="w-24"
              />
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="hero-overlay">Overlay Color</Label>
          <Input
            id="hero-overlay"
            value={properties.overlayColor || ""}
            onChange={e => onChange("overlayColor", e.target.value)}
            placeholder="rgba(0,0,0,0.5)"
          />
        </div>
        <div>
          <Label htmlFor="hero-height">Section Height</Label>
          <Select
            value={properties.height || "h-96"}
            onValueChange={value => onChange("height", value)}
          >
            <SelectTrigger id="hero-height">
              <SelectValue placeholder="Select height" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h-64">Small</SelectItem>
              <SelectItem value="h-96">Medium</SelectItem>
              <SelectItem value="h-screen">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="hero-align">Content Alignment</Label>
          <Select
            value={properties.align || "left"}
            onValueChange={value => onChange("align", value)}
          >
            <SelectTrigger id="hero-align">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <HeroImageUploader
          value={properties.image?.url}
          onChange={url => onChange("image", { ...properties.image, url })}
          label="Side Image"
        />
        <div className="mt-2">
          <Label htmlFor="hero-image-mode">Image Display Mode</Label>
          <Select
            value={properties.image?.mode || "side"}
            onValueChange={value => onChange("image", { ...properties.image, mode: value })}
          >
            <SelectTrigger id="hero-image-mode">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="side">Side</SelectItem>
              <SelectItem value="background">Background</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Buttons</Label>
          {(properties.buttons || []).map((button: any, idx: number) => (
            <div key={idx} className="flex gap-2 items-center mb-2">
              <Input
                value={button.label}
                onChange={e => handleButtonChange(idx, "label", e.target.value)}
                placeholder="Button Text"
                className="w-32"
              />
              <Input
                value={button.href}
                onChange={e => handleButtonChange(idx, "href", e.target.value)}
                placeholder="Button Link"
                className="w-40"
              />
              <Select
                value={button.variant || "primary"}
                onValueChange={value => handleButtonChange(idx, "variant", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={button.size || "large"}
                onValueChange={value => handleButtonChange(idx, "size", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveButton(idx)}
                aria-label="Remove"
              >
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddButton}>
            + Add Button
          </Button>
        </div>
      </div>
    )
  },
}
