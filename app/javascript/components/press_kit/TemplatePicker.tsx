import React from "react"
import { Check, Eye, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocaleStore } from "stores/locales"
import { PRESS_KIT_TEMPLATES, defaultTemplateTheme, resolveTemplate, templateStyle, type PressKitDesign } from "./templates"

interface TemplatePickerProps {
  design: PressKitDesign
  artistName: string
  photos: { id: number | string; url: string; description?: string }[]
  onChange: (design: PressKitDesign) => void
  onPreview: () => void
}

export default function TemplatePicker({ design, artistName, photos, onChange, onPreview }: TemplatePickerProps) {
  const { i18n } = useLocaleStore
  const template = resolveTemplate(design.template)
  const theme = design.theme || defaultTemplateTheme(template)
  const heroPhoto = photos.find((photo) => String(photo.id) === String(design.heroPhotoId)) || photos[0]
  const label = (key: string) => i18n.t(`press_kit.templates.${key}`)

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{label("title")}</h3>
        <p className="text-sm text-muted-foreground">{label("description")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3" role="group" aria-label={label("title")}>
        {PRESS_KIT_TEMPLATES.map((option) => (
          <button key={option} type="button" aria-pressed={template === option}
            onClick={() => onChange({ ...design, template: option, theme: defaultTemplateTheme(option) })}
            className={`overflow-hidden rounded-xl border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${template === option ? "border-primary" : "border-border hover:border-primary/50"}`}>
            <div style={templateStyle(option, defaultTemplateTheme(option) === "dark")} className="relative h-44 overflow-hidden bg-background p-4 text-foreground" aria-hidden="true">
              {option === "poster" && heroPhoto && <img src={heroPhoto.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
              {option === "poster" && <div className="absolute inset-0 bg-gradient-to-t from-black to-black/10" />}
              <div className={`relative h-full ${option === "editorial" ? "grid grid-cols-2 items-center gap-2" : "flex flex-col justify-end"}`}>
                <div className="space-y-3">
                  <div className="h-1 w-8 bg-primary" />
                  <p className={`break-words leading-none ${option === "editorial" ? "font-serif text-2xl" : option === "poster" ? "text-3xl font-black uppercase text-white" : "text-2xl font-bold"}`}>{artistName || "YOUR NAME"}</p>
                  <div className="h-1 w-12 bg-primary/50" />
                </div>
                {option === "editorial" && (heroPhoto ? <img src={heroPhoto.url} alt="" className="h-28 w-full object-contain" /> : <div className="h-28 bg-secondary" />)}
              </div>
            </div>
            <div className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-2"><span className="font-semibold">{label(`${option}.name`)}</span>{template === option && <Check className="h-4 w-4 text-primary" />}</div>
              <p className="text-xs text-muted-foreground">{label(`${option}.description`)}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">{label("theme")}</h4>
        <div className="flex gap-3" role="group" aria-label={label("theme")}>
          {(["light", "dark"] as const).map((value) => (
            <Button key={value} variant={theme === value ? "default" : "outline"} aria-pressed={theme === value} onClick={() => onChange({ ...design, template, theme: value })}>
              {value === "light" ? <Sun /> : <Moon />}{label(value)}
            </Button>
          ))}
        </div>
      </div>
      {template !== "classic" && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">{label("hero_photo")}</h4>
          {photos.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2" role="group" aria-label={label("hero_photo")}>
              {photos.map((photo, index) => (
                <button key={photo.id} type="button" onClick={() => onChange({ ...design, heroPhotoId: photo.id })}
                  aria-label={photo.description || i18n.t("press_kit.slideshow.photo", { number: index + 1 })} aria-pressed={photo.id === heroPhoto?.id}
                  className={`h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${photo.id === heroPhoto?.id ? "border-primary" : "border-border"}`}>
                  <img src={photo.url} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">{label("add_photo")}</p>}
        </div>
      )}
      <Button variant="outline" onClick={onPreview}><Eye />{label("preview")}</Button>
      <p className="text-xs text-muted-foreground">{label("web_only")}</p>
    </div>
  )
}
