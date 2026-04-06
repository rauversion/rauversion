"use client"

import React from "react"
import type { PageStyle, TemplateStyle } from "@/lib/blocks/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface StyleSelectorProps {
  style: PageStyle
  onUpdate: (updates: Partial<PageStyle>) => void
}

const templates: { value: TemplateStyle; label: string; description: string }[] = [
  { value: "minimal", label: "Minimal", description: "Limpio y elegante" },
  { value: "bold", label: "Bold", description: "Colores fuertes y contraste" },
  { value: "gradient", label: "Gradient", description: "Fondos con gradientes" },
  { value: "classic", label: "Classic", description: "Estilo atemporal" },
]

const presetColors = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#8b5cf6", // Violet
  "#ef4444", // Red
  "#22c55e", // Green
  "#3b82f6", // Blue
]

export function StyleSelector({ style, onUpdate }: StyleSelectorProps) {
  return (
    <div className="p-4 border rounded-lg bg-card space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Template */}
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Plantilla:</Label>
          <Select
            value={style.template}
            onValueChange={(v) => onUpdate({ template: v as TemplateStyle })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Primary Color */}
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Color:</Label>
          <div className="flex items-center gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => onUpdate({ primaryColor: color })}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  style.primaryColor === color
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <Input
              type="color"
              value={style.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
              className="w-8 h-8 p-0.5 cursor-pointer border-0"
            />
          </div>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">Dark mode:</Label>
          <Switch
            checked={style.darkMode}
            onCheckedChange={(v) => onUpdate({ darkMode: v })}
          />
        </div>

        {/* Font Family */}
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">Fuente:</Label>
          <Select
            value={style.fontFamily}
            onValueChange={(v) =>
              onUpdate({ fontFamily: v as "sans" | "serif" | "mono" })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">Sans</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="mono">Mono</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
