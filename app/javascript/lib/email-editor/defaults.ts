import { nanoid } from "nanoid"

import type {
  EmailBlock,
  EmailBlockType,
  EmailBioBlock,
  EmailButtonBlock,
  EmailDividerBlock,
  EmailDocument,
  EmailGalleryBlock,
  EmailHeadingBlock,
  EmailImageBlock,
  EmailLinksBlock,
  EmailSectionBlock,
  EmailSpacerBlock,
  EmailTextBlock,
  EmailTheme,
} from "./types"

export const defaultEmailTheme: EmailTheme = {
  bodyBackground: "#f3f0ea",
  contentBackground: "#ffffff",
  contentWidth: 600,
  fontFamily: "sans",
  textColor: "#3b2f2f",
  headingColor: "#1f1a17",
  accentColor: "#b85c38",
  footerText: "Rauversion",
  unsubscribeUrl: "",
}

export function createDefaultEmailBlock(type: EmailBlockType): EmailBlock {
  const id = nanoid()

  switch (type) {
    case "heading":
      return {
        id,
        type: "heading",
        props: {
          text: "Heading principal",
          subtitle: "Subtitulo opcional",
          level: "h1",
          align: "center",
          size: "xl",
        },
      } satisfies EmailHeadingBlock
    case "text":
      return {
        id,
        type: "text",
        props: {
          content: "<p>Escribe el cuerpo del correo aquí.</p>",
          align: "left",
          size: "base",
        },
      } satisfies EmailTextBlock
    case "image":
      return {
        id,
        type: "image",
        props: {
          src: "",
          alt: "",
          href: "",
          align: "center",
          width: "full",
          borderRadius: "md",
        },
      } satisfies EmailImageBlock
    case "gallery":
      return {
        id,
        type: "gallery",
        props: {
          images: [],
          columns: 2,
          gap: "md",
          showCaptions: false,
        },
      } satisfies EmailGalleryBlock
    case "links":
      return {
        id,
        type: "links",
        props: {
          title: "Links",
          layout: "buttons",
          align: "center",
          links: [
            { id: nanoid(), label: "Spotify", url: "" },
            { id: nanoid(), label: "Instagram", url: "" },
          ],
        },
      } satisfies EmailLinksBlock
    case "bio":
      return {
        id,
        type: "bio",
        props: {
          layout: "split",
          name: "Nombre del proyecto",
          role: "Artista / sello / equipo",
          bio: "Agrega una bio breve que funcione bien en correo.",
          image: "",
          imageShape: "rounded",
          ctaText: "Ver más",
          ctaUrl: "",
        },
      } satisfies EmailBioBlock
    case "button":
      return {
        id,
        type: "button",
        props: {
          text: "Abrir enlace",
          href: "",
          align: "center",
          variant: "solid",
          size: "md",
        },
      } satisfies EmailButtonBlock
    case "divider":
      return {
        id,
        type: "divider",
        props: {
          color: "",
          thickness: 1,
          width: "full",
          spacing: "md",
        },
      } satisfies EmailDividerBlock
    case "spacer":
      return {
        id,
        type: "spacer",
        props: {
          height: 32,
        },
      } satisfies EmailSpacerBlock
    case "section":
      return {
        id,
        type: "section",
        props: {
          layout: "image-left",
          eyebrow: "Destacado",
          title: "Sección editorial",
          body: "<p>Combina imagen, texto y CTA en un layout compatible con correo.</p>",
          image: "",
          ctaText: "Leer más",
          ctaUrl: "",
          backgroundColor: "",
        },
      } satisfies EmailSectionBlock
    default:
      throw new Error(`Unknown email block type: ${type}`)
  }
}

export function createNewEmailDocument(name: string = "Nuevo correo"): EmailDocument {
  const now = Date.now()

  return {
    id: nanoid(),
    name,
    subject: "Nuevo correo",
    preheader: "",
    theme: { ...defaultEmailTheme },
    blocks: [
      createDefaultEmailBlock("heading"),
      createDefaultEmailBlock("text"),
      createDefaultEmailBlock("button"),
    ],
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  }
}
