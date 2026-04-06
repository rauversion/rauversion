"use client"

import React from "react"
import type { BioCardBlock as BioCardBlockType, SocialLink } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import { User, Globe, Music2, Play, Cloud, Instagram, Twitter } from "lucide-react"

interface BioCardBlockProps {
  block: BioCardBlockType
  isEditing?: boolean
}

const socialIcons: Record<string, React.ReactNode> = {
  spotify: <Music2 className="h-4 w-4" />,
  "apple-music": <Globe className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
  soundcloud: <Cloud className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  tiktok: <Play className="h-4 w-4" />,
  facebook: <Globe className="h-4 w-4" />,
}

export function BioCardBlock({ block, isEditing }: BioCardBlockProps) {
  const { variant, name, role, bio, image, socialLinks, showSocials } = block.props

  const renderSocials = (links?: SocialLink[]) => {
    if (!showSocials || !links || links.length === 0) return null

    return (
      <div className="flex gap-3 justify-center">
        {links.map((link) => (
          <a
            key={link.id}
            href={isEditing ? undefined : link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
          >
            {socialIcons[link.platform] || null}
          </a>
        ))}
      </div>
    )
  }

  const renderImage = (size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-20 h-20",
      md: "w-32 h-32",
      lg: "w-48 h-48",
    }

    return (
      <div className={cn("relative rounded-full overflow-hidden bg-muted", sizeClasses[size])}>
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-1/2 w-1/2 text-muted-foreground/30" />
          </div>
        )}
      </div>
    )
  }

  switch (variant) {
    case "centered":
      return (
        <div className="flex flex-col items-center text-center p-8">
          {renderImage("lg")}
          <h3 className="text-2xl font-bold mt-6 mb-1">{name}</h3>
          {role && (
            <p className="text-primary font-medium mb-4">{role}</p>
          )}
          <p className="text-muted-foreground max-w-lg leading-relaxed mb-6">
            {bio}
          </p>
          {renderSocials(socialLinks)}
        </div>
      )

    case "horizontal":
      return (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-6 bg-card border border-border rounded-2xl">
          <div className="flex-shrink-0">
            {renderImage("lg")}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-1">{name}</h3>
            {role && (
              <p className="text-primary font-medium mb-4">{role}</p>
            )}
            <p className="text-muted-foreground leading-relaxed mb-6">
              {bio}
            </p>
            <div className="flex gap-3 justify-center md:justify-start">
              {showSocials && socialLinks?.map((link) => (
                <a
                  key={link.id}
                  href={isEditing ? undefined : link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                >
                  {socialIcons[link.platform] || null}
                </a>
              ))}
            </div>
          </div>
        </div>
      )

    case "minimal":
      return (
        <div className="flex items-center gap-4">
          {renderImage("sm")}
          <div>
            <h3 className="font-semibold">{name}</h3>
            {role && (
              <p className="text-sm text-muted-foreground">{role}</p>
            )}
          </div>
        </div>
      )

    case "featured":
      return (
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
          {image ? (
            <div className="relative aspect-[4/5] md:aspect-[3/2]">
              <img src={image} alt={name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[4/5] md:aspect-[3/2] bg-muted" />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-2">{name}</h3>
            {role && (
              <p className="text-white/80 font-medium mb-4">{role}</p>
            )}
            <p className="text-white/70 leading-relaxed max-w-2xl mb-6 line-clamp-3">
              {bio}
            </p>
            {showSocials && socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={isEditing ? undefined : link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  >
                    {socialIcons[link.platform] || null}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )

    default:
      return null
  }
}
