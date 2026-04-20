import type { LucideIcon } from "lucide-react"
import {
  Heading,
  Type,
  Image,
  Images,
  Link2,
  UserRound,
  MousePointerClick,
  Minus,
  SeparatorHorizontal,
  Rows3,
} from "lucide-react"

import type { EmailBlockType } from "./types"

export interface EmailBlockRegistryEntry {
  type: EmailBlockType
  label: string
  description: string
  icon: LucideIcon
  category: "content" | "layout"
}

export const emailBlockRegistry: EmailBlockRegistryEntry[] = [
  {
    type: "heading",
    label: "Heading",
    description: "Titular principal o secundario",
    icon: Heading,
    category: "content",
  },
  {
    type: "text",
    label: "Texto",
    description: "Texto enriquecido compatible con correo",
    icon: Type,
    category: "content",
  },
  {
    type: "image",
    label: "Imagen",
    description: "Imagen simple con link opcional",
    icon: Image,
    category: "content",
  },
  {
    type: "gallery",
    label: "Galería",
    description: "Grid de imágenes email-safe",
    icon: Images,
    category: "content",
  },
  {
    type: "links",
    label: "Links",
    description: "Botones, links inline o lista",
    icon: Link2,
    category: "content",
  },
  {
    type: "bio",
    label: "Bio",
    description: "Bio compacta del artista o proyecto",
    icon: UserRound,
    category: "content",
  },
  {
    type: "button",
    label: "Botón",
    description: "CTA principal",
    icon: MousePointerClick,
    category: "content",
  },
  {
    type: "section",
    label: "Sección",
    description: "Bloque de dos columnas con imagen y copy",
    icon: Rows3,
    category: "content",
  },
  {
    type: "divider",
    label: "Separador",
    description: "Línea divisoria para secciones",
    icon: Minus,
    category: "layout",
  },
  {
    type: "spacer",
    label: "Espaciador",
    description: "Espacio vertical fijo",
    icon: SeparatorHorizontal,
    category: "layout",
  },
]

export const emailBlocksByCategory = {
  content: emailBlockRegistry.filter((entry) => entry.category === "content"),
  layout: emailBlockRegistry.filter((entry) => entry.category === "layout"),
}

export function getEmailBlockEntry(type: EmailBlockType) {
  return emailBlockRegistry.find((entry) => entry.type === type)
}
