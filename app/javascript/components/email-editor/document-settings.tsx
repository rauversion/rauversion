"use client"

import React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EmailDocument, EmailTheme } from "@/lib/email-editor/types"

interface EmailDocumentSettingsProps {
  document: EmailDocument
  onUpdateMeta: (updates: Partial<Pick<EmailDocument, "name" | "subject" | "preheader">>) => void
  onUpdateTheme: (updates: Partial<EmailTheme>) => void
}

const presetColors = ["#b85c38", "#8d5b4c", "#1f6f78", "#1f3c88", "#8c1c13", "#4f5d2f", "#7c3aed", "#111827"]

export function EmailDocumentSettings({
  document,
  onUpdateMeta,
  onUpdateTheme,
}: EmailDocumentSettingsProps) {
  return (
    <div className="space-y-6 p-4">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Meta</h3>
        <div className="space-y-2">
          <Label>Nombre interno</Label>
          <Input value={document.name} onChange={(event) => onUpdateMeta({ name: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={document.subject} onChange={(event) => onUpdateMeta({ subject: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Preheader</Label>
          <Textarea
            value={document.preheader}
            onChange={(event) => onUpdateMeta({ preheader: event.target.value })}
            rows={3}
            placeholder="Texto de apoyo que se ve junto al asunto en inbox"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Theme</h3>
        <div className="space-y-2">
          <Label>Ancho de contenido</Label>
          <Select
            value={String(document.theme.contentWidth)}
            onValueChange={(value) => onUpdateTheme({ contentWidth: value === "640" ? 640 : 600 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="600">600px</SelectItem>
              <SelectItem value="640">640px</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fuente</Label>
          <Select
            value={document.theme.fontFamily}
            onValueChange={(value) => onUpdateTheme({ fontFamily: value === "serif" ? "serif" : "sans" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">Sans</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Acento</Label>
          <div className="flex flex-wrap items-center gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onUpdateTheme({ accentColor: color })}
                className="h-7 w-7 rounded-full border-2"
                style={{
                  backgroundColor: color,
                  borderColor: document.theme.accentColor === color ? "#111827" : "transparent",
                }}
              />
            ))}
            <Input
              type="color"
              value={document.theme.accentColor}
              onChange={(event) => onUpdateTheme({ accentColor: event.target.value })}
              className="h-8 w-10 p-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Body background</Label>
            <Input type="color" value={document.theme.bodyBackground} onChange={(event) => onUpdateTheme({ bodyBackground: event.target.value })} className="h-10 p-1" />
          </div>
          <div className="space-y-2">
            <Label>Card background</Label>
            <Input type="color" value={document.theme.contentBackground} onChange={(event) => onUpdateTheme({ contentBackground: event.target.value })} className="h-10 p-1" />
          </div>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input type="color" value={document.theme.textColor} onChange={(event) => onUpdateTheme({ textColor: event.target.value })} className="h-10 p-1" />
          </div>
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input type="color" value={document.theme.headingColor} onChange={(event) => onUpdateTheme({ headingColor: event.target.value })} className="h-10 p-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Footer</Label>
          <Input value={document.theme.footerText} onChange={(event) => onUpdateTheme({ footerText: event.target.value })} placeholder="Rauversion" />
        </div>
        <div className="space-y-2">
          <Label>Unsubscribe URL</Label>
          <Input value={document.theme.unsubscribeUrl} onChange={(event) => onUpdateTheme({ unsubscribeUrl: event.target.value })} placeholder="https://..." />
        </div>
      </section>
    </div>
  )
}
