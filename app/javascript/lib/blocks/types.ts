export type BlockType =
  | "text"
  | "image"
  | "spacer"
  | "product-item"
  | "section"
  | "playlist"
  | "multi-playlist"
  | "track"
  | "custom-player"
  | "link-embed"
  | "column"
  | "card"
  | "carousel"
  | "button"
  | "hero"
  | "headline"
  | "countdown"
  | "social-links"
  | "tour-dates"
  | "video-background"
  | "gallery"
  | "marquee"
  | "divider"
  | "credits"
  | "press-quotes"
  | "stats"
  | "discography"
  | "bio-card"
  | "accordion"
  | "tabs"
  | "merch-grid"

export type Platform = "spotify" | "youtube" | "soundcloud" | "rauversion"

export type TemplateStyle = "minimal" | "bold" | "gradient" | "classic"

export interface BaseBlock {
  id: string
  type: BlockType
}

export type ProseSize = "sm" | "base" | "lg" | "xl" | "2xl"

export interface TextBlock extends BaseBlock {
  type: "text"
  props: {
    content: string
    alignment: "left" | "center" | "right"
    proseSize: ProseSize
  }
}

export interface ImageBlock extends BaseBlock {
  type: "image"
  props: {
    src: string
    alt: string
    fit: "cover" | "contain" | "fill"
    rounded: "none" | "sm" | "md" | "lg" | "full"
    aspectRatio?: "auto" | "square" | "video" | "portrait"
  }
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer"
  props: {
    height: "sm" | "md" | "lg" | "xl"
  }
}

export interface PlaylistBlock extends BaseBlock {
  type: "playlist"
  props: {
    platform: Platform
    url: string
    height: number
    theme: "dark" | "light" | "auto"
  }
}

export type MultiPlaylistItemSize = "responsive" | "third" | "half"
export type MultiPlaylistOrientation = "horizontal" | "vertical"

export interface MultiPlaylistBlock extends BaseBlock {
  type: "multi-playlist"
  props: {
    playlistIds: string[]
    autoPlay: boolean
    interval: number
    itemSize: MultiPlaylistItemSize
    orientation: MultiPlaylistOrientation
  }
}

export interface TrackBlock extends BaseBlock {
  type: "track"
  props: {
    platform: Platform
    url: string
    showArtwork: boolean
    compact: boolean
  }
}

export interface CustomTrack {
  id: string
  title: string
  artist: string
  duration: number
  audioUrl: string
  artworkUrl?: string
}

export interface CustomPlayerBlock extends BaseBlock {
  type: "custom-player"
  props: {
    tracks: CustomTrack[]
    artwork: string
    accentColor: string
    showWaveform: boolean
  }
}

export interface LinkEmbedBlock extends BaseBlock {
  type: "link-embed"
  props: {
    url: string
    embedType: "youtube" | "generic"
    aspectRatio: "video" | "square"
  }
}

export interface ColumnBlock extends BaseBlock {
  type: "column"
  props: {
    columns: 2 | 3 | 4
    gap: "sm" | "md" | "lg"
  }
  children: Block[]
}

export type CardVariant = "default" | "horizontal" | "featured" | "minimal" | "glass"

export interface CardBlock extends BaseBlock {
  type: "card"
  props: {
    variant: CardVariant
    title: string
    subtitle?: string
    description?: string
    image?: string
    link?: string
    linkText?: string
    badge?: string
  }
}

export type ProductItemVariant = "minimal" | "horizontal" | "compact" | "elegant"
export type ProductItemButtonStyle = "solid" | "outline"
export type ProductItemShadow = "none" | "sm" | "md" | "lg"
export type ProductItemHoverEffect = "none" | "lift" | "grow" | "shadow"
export type ProductItemRoundedCorners = "none" | "sm" | "md" | "lg" | "full"
export type ProductItemAspectRatio = "square" | "video" | "portrait" | "wide"

export interface ProductItemBlock extends BaseBlock {
  type: "product-item"
  props: {
    productId: string
    variant: ProductItemVariant
    backgroundColor: string
    borderColor: string
    titleColor: string
    priceColor: string
    textColor: string
    buttonText: string
    buttonStyle: ProductItemButtonStyle
    shadow: ProductItemShadow
    hoverEffect: ProductItemHoverEffect
    roundedCorners: ProductItemRoundedCorners
    aspectRatio: ProductItemAspectRatio
    showGallery: boolean
  }
}

export type SectionVariant = "left" | "right" | "fixed" | "overlay"
export type SectionTitleSize = "2xl" | "3xl" | "4xl" | "5xl" | "6xl"
export type SectionSubtitleSize = "5xl" | "6xl" | "7xl" | "8xl" | "9xl"
export type SectionTextSize = "base" | "lg" | "xl"
export type SectionThemeMode = "inherit" | "light" | "dark"

export interface SectionBlock extends BaseBlock {
  type: "section"
  props: {
    variant: SectionVariant
    themeMode: SectionThemeMode
    title: string
    subtitle: string
    description: string
    image: string
    titleSize: SectionTitleSize
    subtitleSize: SectionSubtitleSize
    textSize: SectionTextSize
  }
}

export interface CarouselSlide {
  id: string
  blocks: Block[]
}

export interface CarouselBlock extends BaseBlock {
  type: "carousel"
  props: {
    slidesPerView: 1 | 2 | 3
    autoplay: boolean
    autoplayDelay: number
    showDots: boolean
    showArrows: boolean
    loop: boolean
    gap: "sm" | "md" | "lg"
  }
  slides: CarouselSlide[]
}

export type ButtonVariant = 
  | "default" 
  | "outline" 
  | "ghost" 
  | "gradient" 
  | "glow" 
  | "pill"
  | "3d"
  | "minimal"

export type ButtonSize = "sm" | "md" | "lg" | "xl"

export interface ButtonBlock extends BaseBlock {
  type: "button"
  props: {
    text: string
    variant: ButtonVariant
    size: ButtonSize
    href: string
    icon?: "arrow-right" | "external-link" | "play" | "download" | "music" | "none"
    iconPosition: "left" | "right"
    fullWidth: boolean
    alignment: "left" | "center" | "right"
  }
}

export type HeroVariant = 
  | "centered" 
  | "split" 
  | "background" 
  | "gradient" 
  | "minimal"
  | "album"

export interface HeroBlock extends BaseBlock {
  type: "hero"
  props: {
    variant: HeroVariant
    title: string
    subtitle: string
    description?: string
    backgroundImage?: string
    overlayOpacity: number
    alignment: "left" | "center" | "right"
    height: "auto" | "screen" | "large" | "medium"
    ctaText?: string
    ctaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
  }
}

export type HeadlineVariant = 
  | "simple"
  | "gradient"
  | "outline"
  | "highlight"
  | "split"
  | "animated"
  | "decorative"

export type HeadlineSize = "sm" | "md" | "lg" | "xl" | "2xl"

export interface HeadlineBlock extends BaseBlock {
  type: "headline"
  props: {
    text: string
    variant: HeadlineVariant
    size: HeadlineSize
    alignment: "left" | "center" | "right"
    subtitle?: string
    tag: "h1" | "h2" | "h3" | "h4"
    animate: boolean
  }
}

// Countdown Block
export type CountdownVariant = 
  | "cards" 
  | "minimal" 
  | "flip" 
  | "circles" 
  | "neon"
  | "gradient"

export interface CountdownBlock extends BaseBlock {
  type: "countdown"
  props: {
    variant: CountdownVariant
    targetDate: string // ISO date string
    title?: string
    subtitle?: string
    showDays: boolean
    showHours: boolean
    showMinutes: boolean
    showSeconds: boolean
    expiredMessage: string
    alignment: "left" | "center" | "right"
  }
}

// Social Links Block
export type SocialLinksVariant = 
  | "icons" 
  | "buttons" 
  | "pills" 
  | "cards"
  | "floating"
  | "minimal"

export type SocialPlatform = 
  | "spotify"
  | "apple-music"
  | "youtube"
  | "soundcloud"
  | "instagram"
  | "twitter"
  | "tiktok"
  | "facebook"
  | "bandcamp"
  | "deezer"
  | "amazon-music"
  | "website"

export interface SocialLink {
  id: string
  platform: SocialPlatform
  url: string
  label?: string
}

export interface SocialLinksBlock extends BaseBlock {
  type: "social-links"
  props: {
    variant: SocialLinksVariant
    links: SocialLink[]
    size: "sm" | "md" | "lg"
    alignment: "left" | "center" | "right"
    showLabels: boolean
    title?: string
  }
}

// Tour Dates Block
export type TourDatesVariant = 
  | "list" 
  | "cards" 
  | "timeline"
  | "compact"
  | "featured"

export interface TourDate {
  id: string
  date: string
  venue: string
  city: string
  country: string
  ticketUrl?: string
  soldOut: boolean
  featured?: boolean
}

export interface TourDatesBlock extends BaseBlock {
  type: "tour-dates"
  props: {
    variant: TourDatesVariant
    dates: TourDate[]
    title?: string
    emptyMessage: string
    showPastDates: boolean
    ticketButtonText: string
  }
}

// Video Background Block
export type VideoBackgroundVariant = "fullscreen" | "contained" | "parallax" | "split"

export interface VideoBackgroundBlock extends BaseBlock {
  type: "video-background"
  props: {
    variant: VideoBackgroundVariant
    videoUrl: string
    posterImage?: string
    title?: string
    subtitle?: string
    overlayOpacity: number
    overlayColor: string
    height: "screen" | "large" | "medium"
    autoplay: boolean
    loop: boolean
    muted: boolean
  }
}

// Gallery Block
export type GalleryVariant = "grid" | "masonry" | "slider" | "featured"

export interface GalleryImage {
  id: string
  src: string
  alt: string
  caption?: string
}

export interface GalleryBlock extends BaseBlock {
  type: "gallery"
  props: {
    variant: GalleryVariant
    images: GalleryImage[]
    columns: 2 | 3 | 4
    gap: "sm" | "md" | "lg"
    rounded: "none" | "sm" | "md" | "lg"
    showCaptions: boolean
    lightbox: boolean
  }
}

// Marquee Block
export type MarqueeVariant = "simple" | "gradient" | "outlined" | "mixed"

export interface MarqueeBlock extends BaseBlock {
  type: "marquee"
  props: {
    variant: MarqueeVariant
    text: string
    speed: "slow" | "normal" | "fast"
    direction: "left" | "right"
    pauseOnHover: boolean
    repeat: number
    size: "sm" | "md" | "lg" | "xl"
    separator?: string
  }
}

// Divider Block
export type DividerVariant = "line" | "dashed" | "dotted" | "gradient" | "wave" | "zigzag" | "ornament"

export interface DividerBlock extends BaseBlock {
  type: "divider"
  props: {
    variant: DividerVariant
    color: string
    thickness: "thin" | "medium" | "thick"
    width: "full" | "medium" | "short"
    spacing: "sm" | "md" | "lg" | "xl"
  }
}

// Credits Block
export type CreditsVariant = "list" | "columns" | "compact" | "detailed"

export interface Credit {
  id: string
  role: string
  name: string
  link?: string
}

export interface CreditsBlock extends BaseBlock {
  type: "credits"
  props: {
    variant: CreditsVariant
    credits: Credit[]
    title?: string
    alignment: "left" | "center" | "right"
  }
}

// Press Quotes Block
export type PressQuotesVariant = "cards" | "minimal" | "featured" | "slider"

export interface PressQuote {
  id: string
  quote: string
  source: string
  sourceUrl?: string
  rating?: number
  logo?: string
}

export interface PressQuotesBlock extends BaseBlock {
  type: "press-quotes"
  props: {
    variant: PressQuotesVariant
    quotes: PressQuote[]
    showRatings: boolean
    autoplay: boolean
  }
}

// Stats Block
export type StatsVariant = "cards" | "inline" | "circles" | "counters"

export interface Stat {
  id: string
  value: string
  label: string
  prefix?: string
  suffix?: string
  icon?: string
}

export interface StatsBlock extends BaseBlock {
  type: "stats"
  props: {
    variant: StatsVariant
    stats: Stat[]
    animate: boolean
    columns: 2 | 3 | 4
  }
}

// Discography Block
export type DiscographyVariant = "grid" | "list" | "timeline" | "featured"

export interface Album {
  id: string
  title: string
  year: string
  cover: string
  type: "album" | "ep" | "single"
  link?: string
}

export interface DiscographyBlock extends BaseBlock {
  type: "discography"
  props: {
    variant: DiscographyVariant
    albums: Album[]
    title?: string
    showYear: boolean
    showType: boolean
  }
}

// Bio Card Block
export type BioCardVariant = "centered" | "horizontal" | "minimal" | "featured"

export interface BioCardBlock extends BaseBlock {
  type: "bio-card"
  props: {
    variant: BioCardVariant
    name: string
    role?: string
    bio: string
    image?: string
    socialLinks?: SocialLink[]
    showSocials: boolean
  }
}

// Accordion Block
export type AccordionVariant = "default" | "bordered" | "separated" | "minimal"

export interface AccordionItem {
  id: string
  title: string
  content: string
}

export interface AccordionBlock extends BaseBlock {
  type: "accordion"
  props: {
    variant: AccordionVariant
    items: AccordionItem[]
    allowMultiple: boolean
    defaultOpen?: string
  }
}

// Tabs Block
export type TabsVariant = "default" | "pills" | "underline" | "bordered"

export interface TabItem {
  id: string
  label: string
  content: string
}

export interface TabsBlock extends BaseBlock {
  type: "tabs"
  props: {
    variant: TabsVariant
    items: TabItem[]
    defaultTab?: string
    alignment: "left" | "center" | "right"
  }
}

// Merch Grid Block
export type MerchGridVariant = "grid" | "carousel" | "featured"

export interface MerchItem {
  id: string
  name: string
  price: string
  image: string
  link: string
  soldOut: boolean
  badge?: string
}

export interface MerchGridBlock extends BaseBlock {
  type: "merch-grid"
  props: {
    variant: MerchGridVariant
    items: MerchItem[]
    title?: string
    columns: 2 | 3 | 4
    showPrices: boolean
    buttonText: string
  }
}

export type Block =
  | TextBlock
  | ImageBlock
  | SpacerBlock
  | ProductItemBlock
  | SectionBlock
  | PlaylistBlock
  | MultiPlaylistBlock
  | TrackBlock
  | CustomPlayerBlock
  | LinkEmbedBlock
  | ColumnBlock
  | CardBlock
  | CarouselBlock
  | ButtonBlock
  | HeroBlock
  | HeadlineBlock
  | CountdownBlock
  | SocialLinksBlock
  | TourDatesBlock
  | VideoBackgroundBlock
  | GalleryBlock
  | MarqueeBlock
  | DividerBlock
  | CreditsBlock
  | PressQuotesBlock
  | StatsBlock
  | DiscographyBlock
  | BioCardBlock
  | AccordionBlock
  | TabsBlock
  | MerchGridBlock

export interface PageStyle {
  primaryColor: string
  template: TemplateStyle
  darkMode: boolean
  fontFamily: "sans" | "serif" | "mono"
}

export interface Page {
  id: string
  name: string
  blocks: Block[]
  style: PageStyle
  createdAt: number
  updatedAt: number
}

export interface Template {
  id: string
  name: string
  description?: string
  thumbnail?: string
  page: Omit<Page, "id" | "createdAt" | "updatedAt">
}

export interface EditorState {
  currentPage: Page | null
  selectedBlockId: string | null
  isDragging: boolean
  activeTab: "editor" | "preview"
}
