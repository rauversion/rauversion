import type { Template, Block } from "./blocks/types"
import { nanoid } from "nanoid"

const createTextBlock = (content: string, alignment: "left" | "center" | "right" = "center"): Block => ({
  id: nanoid(),
  type: "text",
  props: { content, alignment },
})

const createImageBlock = (src: string = "", alt: string = ""): Block => ({
  id: nanoid(),
  type: "image",
  props: { src, alt, fit: "cover", rounded: "lg", aspectRatio: "video" },
})

const createSpacerBlock = (height: "sm" | "md" | "lg" | "xl" = "md"): Block => ({
  id: nanoid(),
  type: "spacer",
  props: { height },
})

const createPlaylistBlock = (url: string = ""): Block => ({
  id: nanoid(),
  type: "playlist",
  props: { platform: "spotify", url, height: 380, theme: "auto" },
})

const createTrackBlock = (url: string = ""): Block => ({
  id: nanoid(),
  type: "track",
  props: { platform: "spotify", url, showArtwork: true, compact: false },
})

export const defaultTemplates: Template[] = [
  {
    id: "template-single-release",
    name: "Single Release",
    description: "Perfecto para lanzar un single con artwork destacado",
    page: {
      name: "Nuevo Single",
      blocks: [
        createSpacerBlock("lg"),
        createTextBlock("<h1>Nuevo Single</h1>", "center"),
        createTextBlock("<p>Artista - 2024</p>", "center"),
        createSpacerBlock("md"),
        createImageBlock(),
        createSpacerBlock("md"),
        createTrackBlock(),
        createSpacerBlock("lg"),
        createTextBlock("<p>Disponible en todas las plataformas</p>", "center"),
      ],
      style: {
        primaryColor: "#6366f1",
        template: "minimal",
        darkMode: true,
        fontFamily: "sans",
      },
    },
  },
  {
    id: "template-album-release",
    name: "Album Release",
    description: "Ideal para lanzamientos de album completo",
    page: {
      name: "Nuevo Album",
      blocks: [
        createSpacerBlock("lg"),
        createTextBlock("<h1>Nuevo Album</h1>", "center"),
        createTextBlock("<p>Artista - 12 Tracks</p>", "center"),
        createSpacerBlock("md"),
        createImageBlock(),
        createSpacerBlock("lg"),
        createTextBlock("<h2>Tracklist</h2>", "center"),
        createSpacerBlock("sm"),
        createPlaylistBlock(),
        createSpacerBlock("lg"),
        createTextBlock("<h2>Sobre el Album</h2>", "left"),
        createTextBlock("<p>Escribe aqui la historia detras del album, el proceso creativo, colaboraciones y mas.</p>", "left"),
        createSpacerBlock("lg"),
      ],
      style: {
        primaryColor: "#ec4899",
        template: "gradient",
        darkMode: true,
        fontFamily: "sans",
      },
    },
  },
  {
    id: "template-ep-release",
    name: "EP Release",
    description: "Para EPs con multiples tracks destacados",
    page: {
      name: "Nuevo EP",
      blocks: [
        createSpacerBlock("lg"),
        createTextBlock("<h1>EP Title</h1>", "center"),
        createTextBlock("<p>Un nuevo viaje sonoro</p>", "center"),
        createSpacerBlock("md"),
        createImageBlock(),
        createSpacerBlock("lg"),
        createTextBlock("<h2>Tracks Destacados</h2>", "left"),
        createSpacerBlock("sm"),
        createTrackBlock(),
        createSpacerBlock("sm"),
        createTrackBlock(),
        createSpacerBlock("sm"),
        createTrackBlock(),
        createSpacerBlock("lg"),
      ],
      style: {
        primaryColor: "#14b8a6",
        template: "bold",
        darkMode: true,
        fontFamily: "sans",
      },
    },
  },
  {
    id: "template-blank",
    name: "Pagina en Blanco",
    description: "Empieza desde cero con total libertad",
    page: {
      name: "Nueva Pagina",
      blocks: [],
      style: {
        primaryColor: "#6366f1",
        template: "minimal",
        darkMode: true,
        fontFamily: "sans",
      },
    },
  },
]

export function getDefaultTemplates(): Template[] {
  return defaultTemplates
}
