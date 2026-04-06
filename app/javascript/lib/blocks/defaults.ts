import type {
  Block,
  BlockType,
  TextBlock,
  ImageBlock,
  SpacerBlock,
  ProductItemBlock,
  SectionBlock,
  PlaylistBlock,
  TrackBlock,
  CustomPlayerBlock,
  LinkEmbedBlock,
  ColumnBlock,
  CardBlock,
  CarouselBlock,
  ButtonBlock,
  HeroBlock,
  HeadlineBlock,
  CountdownBlock,
  SocialLinksBlock,
  TourDatesBlock,
  VideoBackgroundBlock,
  GalleryBlock,
  MarqueeBlock,
  DividerBlock,
  CreditsBlock,
  PressQuotesBlock,
  StatsBlock,
  DiscographyBlock,
  BioCardBlock,
  AccordionBlock,
  TabsBlock,
  MerchGridBlock,
  PageStyle,
  Page,
} from "./types"
import { nanoid } from "nanoid"

export const defaultPageStyle: PageStyle = {
  primaryColor: "#6366f1",
  template: "minimal",
  darkMode: true,
  fontFamily: "sans",
}

export function createDefaultBlock(type: BlockType): Block {
  const id = nanoid()

  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        props: {
          content: "<p>Escribe tu texto aquí...</p>",
          alignment: "left",
          proseSize: "base",
        },
      } satisfies TextBlock

    case "image":
      return {
        id,
        type: "image",
        props: {
          src: "",
          alt: "",
          fit: "cover",
          rounded: "md",
          aspectRatio: "auto",
        },
      } satisfies ImageBlock

    case "spacer":
      return {
        id,
        type: "spacer",
        props: {
          height: "md",
        },
      } satisfies SpacerBlock

    case "product-item":
      return {
        id,
        type: "product-item",
        props: {
          productId: "",
          variant: "minimal",
          backgroundColor: "#FFFFFF",
          borderColor: "#E5E7EB",
          titleColor: "#111827",
          priceColor: "#111827",
          textColor: "#6B7280",
          buttonText: "Agregar al carrito",
          buttonStyle: "outline",
          shadow: "sm",
          hoverEffect: "lift",
          roundedCorners: "lg",
          aspectRatio: "square",
          showGallery: true,
        },
      } satisfies ProductItemBlock

    case "section":
      return {
        id,
        type: "section",
        props: {
          variant: "left",
          themeMode: "inherit",
          title: "Section Title",
          subtitle: "01",
          description: "<p>Add your section description here...</p>",
          image: "",
          titleSize: "5xl",
          subtitleSize: "8xl",
          textSize: "lg",
        },
      } satisfies SectionBlock

    case "playlist":
      return {
        id,
        type: "playlist",
        props: {
          platform: "spotify",
          url: "",
          height: 380,
          theme: "auto",
        },
      } satisfies PlaylistBlock

    case "track":
      return {
        id,
        type: "track",
        props: {
          platform: "spotify",
          url: "",
          showArtwork: true,
          compact: false,
        },
      } satisfies TrackBlock

    case "custom-player":
      return {
        id,
        type: "custom-player",
        props: {
          tracks: [],
          artwork: "",
          accentColor: "#6366f1",
          showWaveform: true,
        },
      } satisfies CustomPlayerBlock

    case "link-embed":
      return {
        id,
        type: "link-embed",
        props: {
          url: "",
          embedType: "youtube",
          aspectRatio: "video",
        },
      } satisfies LinkEmbedBlock

    case "column":
      return {
        id,
        type: "column",
        props: {
          columns: 2,
          gap: "md",
        },
        children: [],
      } satisfies ColumnBlock

    case "card":
      return {
        id,
        type: "card",
        props: {
          variant: "default",
          title: "Titulo de la Card",
          subtitle: "",
          description: "Descripcion de la card...",
          image: "",
          link: "",
          linkText: "Ver mas",
          badge: "",
        },
      } satisfies CardBlock

    case "carousel":
      return {
        id,
        type: "carousel",
        props: {
          slidesPerView: 1,
          autoplay: false,
          autoplayDelay: 3000,
          showDots: true,
          showArrows: true,
          loop: true,
          gap: "md",
        },
        slides: [
          { id: nanoid(), blocks: [] },
          { id: nanoid(), blocks: [] },
          { id: nanoid(), blocks: [] },
        ],
      } satisfies CarouselBlock

    case "button":
      return {
        id,
        type: "button",
        props: {
          text: "Click aqui",
          variant: "default",
          size: "md",
          href: "",
          icon: "none",
          iconPosition: "right",
          fullWidth: false,
          alignment: "center",
        },
      } satisfies ButtonBlock

    case "hero":
      return {
        id,
        type: "hero",
        props: {
          variant: "centered",
          title: "Nuevo Album",
          subtitle: "Disponible ahora",
          description: "",
          backgroundImage: "",
          overlayOpacity: 50,
          alignment: "center",
          height: "large",
          ctaText: "Escuchar ahora",
          ctaLink: "",
          secondaryCtaText: "",
          secondaryCtaLink: "",
        },
      } satisfies HeroBlock

    case "headline":
      return {
        id,
        type: "headline",
        props: {
          text: "Titulo Principal",
          variant: "simple",
          size: "xl",
          alignment: "center",
          subtitle: "",
          tag: "h2",
          animate: false,
        },
      } satisfies HeadlineBlock

    case "countdown":
      // Default target: 7 days from now
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 7)
      return {
        id,
        type: "countdown",
        props: {
          variant: "cards",
          targetDate: targetDate.toISOString(),
          title: "Lanzamiento en",
          subtitle: "",
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          expiredMessage: "Ya disponible!",
          alignment: "center",
        },
      } satisfies CountdownBlock

    case "social-links":
      return {
        id,
        type: "social-links",
        props: {
          variant: "icons",
          links: [
            { id: nanoid(), platform: "spotify", url: "" },
            { id: nanoid(), platform: "apple-music", url: "" },
            { id: nanoid(), platform: "instagram", url: "" },
            { id: nanoid(), platform: "youtube", url: "" },
          ],
          size: "md",
          alignment: "center",
          showLabels: false,
          title: "",
        },
      } satisfies SocialLinksBlock

    case "tour-dates":
      return {
        id,
        type: "tour-dates",
        props: {
          variant: "list",
          dates: [
            {
              id: nanoid(),
              date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              venue: "Venue Name",
              city: "Ciudad",
              country: "Pais",
              ticketUrl: "",
              soldOut: false,
            },
          ],
          title: "Proximas Fechas",
          emptyMessage: "No hay fechas programadas",
          showPastDates: false,
          ticketButtonText: "Tickets",
        },
      } satisfies TourDatesBlock

    case "video-background":
      return {
        id,
        type: "video-background",
        props: {
          variant: "fullscreen",
          videoUrl: "",
          posterImage: "",
          title: "",
          subtitle: "",
          overlayOpacity: 40,
          overlayColor: "#000000",
          height: "large",
          autoplay: true,
          loop: true,
          muted: true,
        },
      } satisfies VideoBackgroundBlock

    case "gallery":
      return {
        id,
        type: "gallery",
        props: {
          variant: "grid",
          images: [],
          columns: 3,
          gap: "md",
          rounded: "md",
          showCaptions: false,
          lightbox: true,
        },
      } satisfies GalleryBlock

    case "marquee":
      return {
        id,
        type: "marquee",
        props: {
          variant: "simple",
          text: "NUEVO ALBUM DISPONIBLE",
          speed: "normal",
          direction: "left",
          pauseOnHover: true,
          repeat: 4,
          size: "lg",
          separator: "•",
        },
      } satisfies MarqueeBlock

    case "divider":
      return {
        id,
        type: "divider",
        props: {
          variant: "line",
          color: "",
          thickness: "thin",
          width: "full",
          spacing: "md",
        },
      } satisfies DividerBlock

    case "credits":
      return {
        id,
        type: "credits",
        props: {
          variant: "list",
          credits: [
            { id: nanoid(), role: "Producido por", name: "" },
            { id: nanoid(), role: "Escrito por", name: "" },
            { id: nanoid(), role: "Mezclado por", name: "" },
          ],
          title: "Creditos",
          alignment: "left",
        },
      } satisfies CreditsBlock

    case "press-quotes":
      return {
        id,
        type: "press-quotes",
        props: {
          variant: "cards",
          quotes: [
            { id: nanoid(), quote: "Una obra maestra...", source: "Rolling Stone", rating: 5 },
          ],
          showRatings: true,
          autoplay: false,
        },
      } satisfies PressQuotesBlock

    case "stats":
      return {
        id,
        type: "stats",
        props: {
          variant: "cards",
          stats: [
            { id: nanoid(), value: "1M", label: "Streams", suffix: "+" },
            { id: nanoid(), value: "500K", label: "Seguidores" },
            { id: nanoid(), value: "50", label: "Paises" },
          ],
          animate: true,
          columns: 3,
        },
      } satisfies StatsBlock

    case "discography":
      return {
        id,
        type: "discography",
        props: {
          variant: "grid",
          albums: [],
          title: "Discografia",
          showYear: true,
          showType: true,
        },
      } satisfies DiscographyBlock

    case "bio-card":
      return {
        id,
        type: "bio-card",
        props: {
          variant: "centered",
          name: "Nombre del Artista",
          role: "Artista / Productor",
          bio: "Biografia del artista...",
          image: "",
          socialLinks: [],
          showSocials: true,
        },
      } satisfies BioCardBlock

    case "accordion":
      return {
        id,
        type: "accordion",
        props: {
          variant: "default",
          items: [
            { id: nanoid(), title: "Pregunta 1", content: "Respuesta 1..." },
            { id: nanoid(), title: "Pregunta 2", content: "Respuesta 2..." },
          ],
          allowMultiple: false,
          defaultOpen: "",
        },
      } satisfies AccordionBlock

    case "tabs":
      return {
        id,
        type: "tabs",
        props: {
          variant: "default",
          items: [
            { id: nanoid(), label: "Tab 1", content: "Contenido del tab 1..." },
            { id: nanoid(), label: "Tab 2", content: "Contenido del tab 2..." },
          ],
          defaultTab: "",
          alignment: "left",
        },
      } satisfies TabsBlock

    case "merch-grid":
      return {
        id,
        type: "merch-grid",
        props: {
          variant: "grid",
          items: [],
          title: "Merch",
          columns: 3,
          showPrices: true,
          buttonText: "Comprar",
        },
      } satisfies MerchGridBlock

    default:
      throw new Error(`Unknown block type: ${type}`)
  }
}

export function createNewPage(name: string = "Nueva Página"): Page {
  return {
    id: nanoid(),
    name,
    blocks: [],
    style: { ...defaultPageStyle },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export const blockTypeLabels: Record<BlockType, string> = {
  text: "Texto",
  image: "Imagen",
  spacer: "Espaciador",
  "product-item": "Producto",
  section: "Section",
  playlist: "Playlist",
  track: "Track",
  "custom-player": "Player Custom",
  "link-embed": "Embed Link",
  column: "Columnas",
  card: "Card",
  carousel: "Carousel",
  button: "Boton",
  hero: "Hero",
  headline: "Headline",
  countdown: "Countdown",
  "social-links": "Social Links",
  "tour-dates": "Tour Dates",
  "video-background": "Video Background",
  gallery: "Galeria",
  marquee: "Marquee",
  divider: "Separador",
  credits: "Creditos",
  "press-quotes": "Press Quotes",
  stats: "Estadisticas",
  discography: "Discografia",
  "bio-card": "Bio Card",
  accordion: "Acordeon",
  tabs: "Tabs",
  "merch-grid": "Merch",
}

export const blockTypeDescriptions: Record<BlockType, string> = {
  text: "Editor de texto enriquecido",
  image: "Imagen con opciones de ajuste",
  spacer: "Espacio vertical configurable",
  "product-item": "Card de producto de tu cuenta",
  section: "Seccion editorial con imagen y texto",
  playlist: "Embed de playlist de Spotify, YouTube o SoundCloud",
  track: "Track individual embebido",
  "custom-player": "Reproductor de audio personalizado",
  "link-embed": "Embed de YouTube u otros enlaces",
  column: "Contenedor de múltiples columnas",
  card: "Card con variantes de previsualización",
  carousel: "Carrusel de slides con bloques",
  button: "Boton con multiples variantes",
  hero: "Seccion hero con imagen de fondo",
  headline: "Titulo con variantes elegantes",
  countdown: "Cuenta regresiva para lanzamientos",
  "social-links": "Links a redes y plataformas",
  "tour-dates": "Fechas de gira y conciertos",
  "video-background": "Seccion con video de fondo",
  gallery: "Galeria de imagenes con lightbox",
  marquee: "Texto en movimiento horizontal",
  divider: "Separador decorativo",
  credits: "Lista de creditos del album",
  "press-quotes": "Testimonios y quotes de prensa",
  stats: "Numeros y estadisticas animadas",
  discography: "Grid de albums anteriores",
  "bio-card": "Tarjeta de biografia del artista",
  accordion: "Contenido colapsable FAQ",
  tabs: "Contenido en pestanas",
  "merch-grid": "Grid de productos merch",
}
