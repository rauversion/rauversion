"use client"
import React, { useRef } from "react"
import { Layout } from "lucide-react"
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ChromePicker } from "react-color"
import * as Popover from "@radix-ui/react-popover"

const VARIANTS = [
  { label: "Left Image", value: "left" },
  { label: "Right Image", value: "right" },
  { label: "Fixed Layout", value: "fixed" },
  { label: "Overlay", value: "overlay" }
]

const TITLE_SIZES = [
  { label: "Small", value: "text-2xl" },
  { label: "Medium", value: "text-3xl" },
  { label: "Large", value: "text-4xl" },
  { label: "Extra Large", value: "text-5xl" },
  { label: "2XL", value: "text-6xl" }
]

const SUBTITLE_SIZES = [
  { label: "Large", value: "text-6xl" },
  { label: "Extra Large", value: "text-7xl" },
  { label: "2XL", value: "text-8xl" },
  { label: "3XL", value: "text-9xl" }
]

const TEXT_SIZES = [
  { label: "Small", value: "text-base" },
  { label: "Medium", value: "text-lg" },
  { label: "Large", value: "text-xl" }
]

const PADDINGS = [
  { label: "None", value: "p-0" },
  { label: "Small", value: "px-4 py-8" },
  { label: "Medium", value: "px-6 py-10" },
  { label: "Large", value: "px-8 py-12" },
  { label: "Extra Large", value: "px-10 py-16" }
]

export const sectionBlock: BlockDefinition = {
  type: "section",
  label: "Section",
  icon: <Layout size={16} />,
  canHaveChildren: true,
  defaultProperties: {
    variant: "left",
    title: "Section Title",
    titleSize: "text-5xl",
    titleColor: "#000000",
    subtitle: "01",
    subtitleSize: "text-8xl",
    subtitleColor: "#6B7280",
    description: "Add your section description here...",
    textSize: "text-lg",
    textColor: "#4B5563",
    image: "",
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    padding: "px-8 py-12"
  },
  render: ({ block }: BlockRendererProps) => {
    const {
      variant,
      title,
      subtitle,
      description,
      image,
      backgroundColor,
      borderColor,
      titleColor,
      subtitleColor,
      textColor,
      padding,
      titleSize,
      subtitleSize,
      textSize
    } = block.properties

    const renderLeftVariant = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col sm:flex-row space-y-4 items-center space-x-4">
          {image && (
            <img src={image} alt="" className="rounded-lg w-full object-cover" />
          )}
          <div
            className={cn(textSize, "text-subtle")}
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex justify-end">
            <p className={cn(subtitleSize, "font-bold")} style={{ color: subtitleColor }}>
              {subtitle}
            </p>
          </div>
          <p className={cn(titleSize, "font-bold uppercase tracking-tight text-right")} style={{ color: titleColor }}>
            {title}
          </p>
        </div>
      </div>
    )

    const renderRightVariant = () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col space-y-4">
          <h2 className={cn(titleSize, "font-bold uppercase")} style={{ color: titleColor }}>
            {title}
          </h2>
          <div
            className={cn(textSize, "text-subtle")}
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
        <div className="flex justify-end flex-col">
          {image && (
            <img src={image} alt="" className="rounded-lg w-full object-cover mb-4" />
          )}
          <p className={cn(subtitleSize, "font-bold text-subtle text-right")} style={{ color: subtitleColor }}>
            {subtitle}
          </p>
        </div>
      </div>
    )

    const renderFixedVariant = () => (
      <div className="flex flex-col space-y-6">
        <h2 className={cn(titleSize, "font-bold uppercase")} style={{ color: titleColor }}>
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div
              className={cn(textSize, "text-subtle")}
              style={{ color: textColor }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
          <div className="flex flex-col">
            {image && (
              <img src={image} alt="" className="rounded-lg w-full object-cover" />
            )}
          </div>
        </div>
      </div>
    )

    const renderOverlayVariant = () => (
      <div className="w-full relative">
        <div className="w-full aspect-[4/3] md:aspect-[16/9] relative">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-full h-full sm:grayscale hover:grayscale-0 transition-all duration-300"
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
        <div className="sm:absolute top-0 right-0 bottom-0 w-full md:w-1/2 lg:w-2/5 flex items-center justify-center">
          <div
            className="p-6 md:p-8 w-full h-full flex flex-col justify-center"
            style={{
              backgroundColor: backgroundColor,
              opacity: 0.75
            }}
          >
            <h1
              className={cn(titleSize, "font-bold tracking-tight leading-none")}
              style={{ color: titleColor }}
            >
              {title}
            </h1>
            <p
              className={cn(subtitleSize, "font-bold uppercase tracking-tight text-right")}
              style={{ color: subtitleColor }}
            >
              {subtitle}
            </p>
            <div className="mt-4 text-sm" style={{ color: textColor }}>
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          </div>
        </div>
      </div>
    )

    const variants: any = {
      left: renderLeftVariant,
      right: renderRightVariant,
      fixed: renderFixedVariant,
      overlay: renderOverlayVariant
    }

    const renderVariant = variants[variant] || variants.left

    return (
      <section
        className={cn(
          variant === "overlay" ? "" : "container mx-auto",
          padding,
          "border-t-4"
        )}
        style={{
          backgroundColor: variant === "overlay" ? "transparent" : backgroundColor,
          borderColor: borderColor
        }}
      >
        {renderVariant()}
        {/* Render children blocks if any */}
        {block.children && Array.isArray(block.children) && block.children.length > 0 && (
          <div className="mt-6">
            {block.children.map((child: any) => {
              const BlockRenderer = require("../block-renderer").BlockRenderer
              return (
                <BlockRenderer
                  key={child.id}
                  block={child}
                  isSelected={false}
                  onSelect={() => {}}
                />
              )
            })}
          </div>
        )}
      </section>
    )
  },
  propertyEditor: (props: PropertyEditorProps) => <SectionPropertyEditor {...props} />
}

function SectionPropertyEditor({ properties, onChange }: PropertyEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      // @ts-ignore
      const { post } = await import("@rails/request.js")
      const response = await post("/releases/upload_puck_image.json", {
        body: formData,
        responseKind: "json",
        contentType: false
      })
      // @ts-ignore
      const data = await response.json
      if (data && data.url) {
        onChange("image", data.url)
        toast({ title: "Image uploaded", description: "Image uploaded successfully." })
      }
    } catch (error) {
      toast({ title: "Upload failed", description: "Image upload failed.", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Variant</Label>
        <Select value={properties.variant} onValueChange={(v) => onChange("variant", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select variant" />
          </SelectTrigger>
          <SelectContent>
            {VARIANTS.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input value={properties.title} onChange={(e) => onChange("title", e.target.value)} />
      </div>
      <div>
        <Label>Title Size</Label>
        <Select value={properties.titleSize} onValueChange={(v) => onChange("titleSize", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select title size" />
          </SelectTrigger>
          <SelectContent>
            {TITLE_SIZES.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title Color</Label>
        <div className="flex items-center gap-4">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.titleColor || "transparent",
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
                color={properties.titleColor || "#000"}
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
            value={properties.titleColor}
            onChange={(e) => onChange("titleColor", e.target.value)}
            placeholder="#000000"
            type="text"
            className="w-36"
          />
        </div>
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input value={properties.subtitle} onChange={(e) => onChange("subtitle", e.target.value)} />
      </div>
      <div>
        <Label>Subtitle Size</Label>
        <Select value={properties.subtitleSize} onValueChange={(v) => onChange("subtitleSize", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select subtitle size" />
          </SelectTrigger>
          <SelectContent>
            {SUBTITLE_SIZES.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Subtitle Color</Label>
        <div className="flex items-center gap-4">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.subtitleColor || "transparent",
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
                color={properties.subtitleColor || "#6B7280"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("subtitleColor", value)
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
            value={properties.subtitleColor}
            onChange={(e) => onChange("subtitleColor", e.target.value)}
            placeholder="#6B7280"
            type="text"
            className="w-36"
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={properties.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={4}
        />
      </div>
      <div>
        <Label>Text Size</Label>
        <Select value={properties.textSize} onValueChange={(v) => onChange("textSize", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select text size" />
          </SelectTrigger>
          <SelectContent>
            {TEXT_SIZES.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Text Color</Label>
        <div className="flex items-center gap-4">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.textColor || "transparent",
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
                color={properties.textColor || "#4B5563"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("textColor", value)
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
            value={properties.textColor}
            onChange={(e) => onChange("textColor", e.target.value)}
            placeholder="#4B5563"
            type="text"
            className="w-36"
          />
        </div>
      </div>
      <div>
        <Label>Image</Label>
        <div className="flex items-center gap-2">
          <Input
            value={properties.image}
            onChange={(e) => onChange("image", e.target.value)}
            placeholder="Image URL"
            type="text"
            className="w-64"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </div>
        {properties.image && (
          <div className="mt-2">
            <img src={properties.image} alt="Section" className="w-full max-w-xs rounded" />
          </div>
        )}
      </div>
      <div>
        <Label>Background Color</Label>
        <div className="flex items-center gap-4">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.backgroundColor || "transparent",
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
                color={properties.backgroundColor || "#fff"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("backgroundColor", value)
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
            value={properties.backgroundColor}
            onChange={(e) => onChange("backgroundColor", e.target.value)}
            placeholder="#FFFFFF"
            type="text"
            className="w-36"
          />
        </div>
      </div>
      <div>
        <Label>Border Color</Label>
        <div className="flex items-center gap-4">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.borderColor || "transparent",
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
                color={properties.borderColor || "#D1D5DB"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("borderColor", value)
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
            value={properties.borderColor}
            onChange={(e) => onChange("borderColor", e.target.value)}
            placeholder="#D1D5DB"
            type="text"
            className="w-36"
          />
        </div>
      </div>
      <div>
        <Label>Padding</Label>
        <Select value={properties.padding} onValueChange={(v) => onChange("padding", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select padding" />
          </SelectTrigger>
          <SelectContent>
            {PADDINGS.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
