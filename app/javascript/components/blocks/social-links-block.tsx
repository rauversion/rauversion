"use client"

import React from "react"
import type { SocialLinksBlock as SocialLinksBlockType, SocialPlatform } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { 
  Music, 
  Youtube, 
  Instagram, 
  Twitter, 
  Facebook,
  Globe,
  ExternalLink,
} from "lucide-react"

interface SocialLinksBlockProps {
  block: SocialLinksBlockType
  isEditing?: boolean
}

const platformConfig: Record<SocialPlatform, { 
  name: string
  color: string
  icon: React.ReactNode
}> = {
  spotify: {
    name: "Spotify",
    color: "#1DB954",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  },
  "apple-music": {
    name: "Apple Music",
    color: "#FA243C",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81.84-.553 1.472-1.287 1.88-2.208.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.455-2.107-1.341-.257-.706-.18-1.403.25-2.035.378-.556.921-.868 1.575-1.002.36-.073.724-.118 1.09-.168.186-.024.372-.054.556-.084.324-.054.515-.242.56-.576.003-.027.007-.055.007-.082V9.668c0-.264-.118-.39-.379-.342-.603.112-1.205.227-1.807.34l-2.467.465c-.016.003-.032.01-.048.012-.276.052-.383.168-.396.45-.002.04 0 .08 0 .118v7.81c0 .446-.062.886-.27 1.286-.3.576-.77.932-1.397 1.096-.36.094-.725.142-1.097.152-.9.025-1.722-.44-2.047-1.303-.27-.717-.188-1.426.253-2.073.368-.54.9-.84 1.538-.975.37-.08.746-.133 1.122-.19.17-.025.34-.06.507-.09.338-.062.527-.26.564-.598.002-.02.004-.038.004-.058V6.016c0-.088.007-.176.02-.264.052-.333.244-.533.564-.596l5.427-1.022c.343-.065.687-.125 1.03-.19.394-.075.602.093.602.497v5.673z"/>
      </svg>
    ),
  },
  youtube: {
    name: "YouTube",
    color: "#FF0000",
    icon: <Youtube className="w-full h-full" />,
  },
  soundcloud: {
    name: "SoundCloud",
    color: "#FF5500",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.055-.048-.1-.098-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.057.045.09.104.09.057 0 .09-.04.102-.092l.21-1.28-.21-1.332c-.012-.055-.045-.094-.102-.094zm1.83-1.143c-.063 0-.112.05-.119.107l-.208 2.462.208 2.353c.007.057.056.108.12.108.063 0 .11-.05.116-.108l.236-2.353-.236-2.462c-.006-.057-.053-.107-.117-.107zm.912-.428c-.073 0-.125.054-.131.127l-.18 2.89.18 2.723c.006.073.058.127.131.127.072 0 .124-.054.13-.127l.202-2.723-.202-2.89c-.006-.073-.058-.127-.13-.127zm.903-.324c-.08 0-.137.06-.145.14l-.153 3.218.153 2.958c.008.08.065.14.145.14.08 0 .136-.06.144-.14l.173-2.958-.173-3.218c-.008-.08-.064-.14-.144-.14zm.912-.163c-.088 0-.15.064-.157.152l-.126 3.38.126 3.06c.007.09.07.155.157.155.09 0 .152-.065.16-.155l.14-3.06-.14-3.38c-.008-.088-.07-.152-.16-.152zm.896-.12c-.098 0-.165.07-.172.166l-.1 3.5.1 3.103c.007.096.074.167.172.167.096 0 .164-.07.17-.167l.112-3.103-.112-3.5c-.006-.096-.074-.166-.17-.166zm.904-.055c-.104 0-.176.074-.182.178l-.073 3.555.073 3.13c.006.104.078.18.182.18.104 0 .175-.076.182-.18l.082-3.13-.082-3.555c-.007-.104-.078-.178-.182-.178zm.89 0c-.113 0-.188.08-.194.19l-.046 3.555.046 3.14c.006.11.08.19.194.19.113 0 .187-.08.193-.19l.052-3.14-.052-3.555c-.006-.11-.08-.19-.193-.19zm.903.005c-.12 0-.198.083-.204.2l-.02 3.55.02 3.135c.006.12.084.202.204.202.12 0 .197-.082.203-.202l.022-3.135-.022-3.55c-.006-.117-.083-.2-.203-.2zm7.18 3.538c-.27 0-.52.036-.76.102-.16-1.77-1.666-3.154-3.496-3.154-.475 0-.932.09-1.347.25-.16.064-.2.13-.203.256v6.168c.003.13.096.238.227.25h5.58c1.153 0 2.088-.938 2.088-2.093 0-1.154-.936-2.09-2.09-2.09z"/>
      </svg>
    ),
  },
  instagram: {
    name: "Instagram",
    color: "#E4405F",
    icon: <Instagram className="w-full h-full" />,
  },
  twitter: {
    name: "X",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  tiktok: {
    name: "TikTok",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
  facebook: {
    name: "Facebook",
    color: "#1877F2",
    icon: <Facebook className="w-full h-full" />,
  },
  bandcamp: {
    name: "Bandcamp",
    color: "#629AA9",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
      </svg>
    ),
  },
  deezer: {
    name: "Deezer",
    color: "#FEAA2D",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.566v3.027h5.189v-3.027h-5.19zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.752v3.027h5.19v-3.027H0zm6.27 0v3.027h5.189v-3.027h-5.19zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19z"/>
      </svg>
    ),
  },
  "amazon-music": {
    name: "Amazon Music",
    color: "#00A8E1",
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
        <path d="M19.62 17.057c-.157.104-.384.07-.541-.07-1.133-.945-2.37-1.785-3.642-2.66a16.899 16.899 0 0 1-3.083-2.624c-.94-.94-1.924-1.889-2.624-3.083-.875-1.271-1.715-2.509-2.66-3.642-.14-.157-.174-.384-.07-.541.087-.157.314-.227.49-.157 4.126 1.541 7.61 4.252 9.745 7.872a17.006 17.006 0 0 1 2.457 5.274c.07.175-.052.384-.21.489a.513.513 0 0 1-.362.142zm2.754.595c.35.245.42.7.175 1.05-.21.28-.56.42-.91.35-.315-.07-.595-.28-.735-.56-.245-.49-.14-1.085.315-1.4.455-.315 1.085-.21 1.4.245.035.105.07.21.035.315zm-10.02 3.15c.07-.14.175-.245.315-.315 1.715-.735 3.325-1.68 4.795-2.8.21-.14.49-.21.735-.14.245.07.455.28.525.525.07.245.035.49-.105.7a19.23 19.23 0 0 1-5.495 3.57c-.28.105-.595.07-.84-.105-.245-.175-.385-.455-.35-.77.035-.21.14-.42.28-.56.035-.035.105-.07.14-.105z"/>
      </svg>
    ),
  },
  website: {
    name: "Website",
    color: "#6366F1",
    icon: <Globe className="w-full h-full" />,
  },
}

export function SocialLinksBlock({ block, isEditing }: SocialLinksBlockProps) {
  const { variant, links, size, alignment, showLabels, title } = block.props

  const alignmentClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[alignment]

  const textAlignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment]

  const sizeClasses = {
    sm: { icon: "w-5 h-5", button: "p-2", text: "text-xs" },
    md: { icon: "w-6 h-6", button: "p-3", text: "text-sm" },
    lg: { icon: "w-8 h-8", button: "p-4", text: "text-base" },
  }[size]

  const validLinks = links.filter(link => link.url || isEditing)

  if (validLinks.length === 0 && !isEditing) {
    return null
  }

  const renderLink = (link: typeof links[0], index: number) => {
    const config = platformConfig[link.platform]
    const href = link.url || "#"
    const isDisabled = !link.url
    const key = link.id || index

    const commonProps = {
      href: isEditing ? undefined : href,
      target: "_blank" as const,
      rel: "noopener noreferrer",
      onClick: isEditing ? (e: React.MouseEvent) => e.preventDefault() : undefined,
    }

    switch (variant) {
      case "icons":
        return (
          <a
            key={key}
            {...commonProps}
            className={cn(
              "transition-all duration-300 hover:scale-110",
              sizeClasses.button,
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ color: config.color }}
            title={config.name}
          >
            <div className={sizeClasses.icon}>{config.icon}</div>
          </a>
        )

      case "buttons":
        return (
          <a
            key={key}
            {...commonProps}
            className={cn(
              "flex items-center gap-2 rounded-lg text-white font-medium transition-all duration-300 hover:opacity-90 hover:scale-105",
              sizeClasses.button,
              sizeClasses.text,
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ backgroundColor: config.color }}
          >
            <div className={sizeClasses.icon}>{config.icon}</div>
            {showLabels && <span>{link.label || config.name}</span>}
          </a>
        )

      case "pills":
        return (
          <a
            key={key}
            {...commonProps}
            className={cn(
              "flex items-center gap-2 rounded-full border-2 transition-all duration-300 hover:scale-105",
              sizeClasses.button,
              sizeClasses.text,
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ borderColor: config.color, color: config.color }}
          >
            <div className={sizeClasses.icon}>{config.icon}</div>
            {showLabels && <span className="pr-2">{link.label || config.name}</span>}
          </a>
        )

      case "cards":
        return (
          <a
            key={key}
            {...commonProps}
            className={cn(
              "flex flex-col items-center gap-2 bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:border-primary hover:shadow-lg hover:scale-105 min-w-[100px]",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center p-2"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {config.icon}
            </div>
            <span className="text-sm font-medium text-foreground">
              {link.label || config.name}
            </span>
          </a>
        )

      case "floating":
        return (
          <a
            key={key}
            {...commonProps}
            className={cn(
              "group relative flex items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110",
              sizeClasses.button,
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ 
              backgroundColor: config.color,
              boxShadow: `0 4px 14px ${config.color}50`,
            }}
          >
            <div className={sizeClasses.icon}>{config.icon}</div>
            {showLabels && (
              <span className="absolute -bottom-8 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {link.label || config.name}
              </span>
            )}
          </a>
        )

      case "minimal":
        return (
          <a
            key={key}
            {...commonProps}
            className={cn(
              "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300",
              sizeClasses.text,
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={sizeClasses.icon}>{config.icon}</div>
            {showLabels && <span>{link.label || config.name}</span>}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        )

      default:
        return null
    }
  }

  return (
    <div className="py-4">
      {title && (
        <p className={cn("text-sm text-muted-foreground mb-4 uppercase tracking-wider", textAlignClass)}>
          {title}
        </p>
      )}
      <div className={cn(
        "flex flex-wrap gap-3",
        alignmentClass,
        variant === "minimal" && "flex-col items-start gap-2"
      )}>
        {validLinks.map((link, i) => renderLink(link, i))}
      </div>
    </div>
  )
}
