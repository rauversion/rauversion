"use client"

import React from "react"
import type { Block, BlockType, PageStyle } from "@/lib/blocks/types"
import { TextBlock } from "./text-block"
import { ImageBlock } from "./image-block"
import { SpacerBlock } from "./spacer-block"
import { ProductItemBlock } from "./product-item-block"
import { SectionBlock } from "./section-block"
import { PlaylistBlock } from "./playlist-block"
import { MultiPlaylistBlock } from "./multi-playlist-block"
import { TrackBlock } from "./track-block"
import { LinkEmbedBlock } from "./link-embed-block"
import { ColumnBlock } from "./column-block"
import { CustomPlayerBlock } from "./custom-player-block"
import { CardBlock } from "./card-block"
import { CarouselBlock } from "./carousel-block"
import { ButtonBlock } from "./button-block"
import { HeroBlock } from "./hero-block"
import { HeadlineBlock } from "./headline-block"
import { CountdownBlock } from "./countdown-block"
import { SocialLinksBlock } from "./social-links-block"
import { TourDatesBlock } from "./tour-dates-block"
import { VideoBackgroundBlock } from "./video-background-block"
import { GalleryBlock } from "./gallery-block"
import { MarqueeBlock } from "./marquee-block"
import { DividerBlock } from "./divider-block"
import { CreditsBlock } from "./credits-block"
import { PressQuotesBlock } from "./press-quotes-block"
import { StatsBlock } from "./stats-block"
import { DiscographyBlock } from "./discography-block"
import { BioCardBlock } from "./bio-card-block"
import { AccordionBlock } from "./accordion-block"
import { TabsBlock } from "./tabs-block"
import { MerchGridBlock } from "./merch-grid-block"
import { cn } from "@/lib/utils"

interface BlockRendererProps {
  block: Block
  pageStyle?: PageStyle
  isEditing?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
  onUpdateProps?: (id: string, props: Record<string, unknown>) => void
  selectedBlockId?: string | null
  // For column blocks
  onUpdateChildren?: (blockId: string, children: Block[]) => void
  onAddChildBlock?: (blockId: string, columnIndex: number, blockType: BlockType) => void
  onRemoveChildBlock?: (blockId: string, childId: string) => void
  // For carousel blocks
  onUpdateCarouselSlides?: (blockId: string, slides: import("@/lib/blocks/types").CarouselSlide[]) => void
}

export function BlockRenderer({
  block,
  pageStyle,
  isEditing = false,
  isSelected = false,
  onSelect,
  onUpdateProps,
  selectedBlockId,
  onUpdateChildren,
  onAddChildBlock,
  onRemoveChildBlock,
  onUpdateCarouselSlides,
}: BlockRendererProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (isEditing && onSelect) {
      e.stopPropagation()
      onSelect(block.id)
    }
  }

  const content = (() => {
    switch (block.type) {
      case "text":
        return (
          <TextBlock
            block={block}
            isEditing={isEditing}
            onUpdate={onUpdateProps ? (props) => onUpdateProps(block.id, props) : undefined}
          />
        )
      case "image":
        return (
          <ImageBlock
            block={block}
            isEditing={isEditing}
            onUpdate={onUpdateProps ? (props) => onUpdateProps(block.id, props) : undefined}
          />
        )
      case "spacer":
        return <SpacerBlock block={block} isEditing={isEditing} />
      case "product-item":
        return <ProductItemBlock block={block} isEditing={isEditing} />
      case "section":
        return <SectionBlock block={block} pageStyle={pageStyle} isEditing={isEditing} />
      case "playlist":
        return <PlaylistBlock block={block} pageStyle={pageStyle} isEditing={isEditing} />
      case "multi-playlist":
        return <MultiPlaylistBlock block={block} pageStyle={pageStyle} isEditing={isEditing} />
      case "track":
        return <TrackBlock block={block} isEditing={isEditing} />
      case "link-embed":
        return <LinkEmbedBlock block={block} isEditing={isEditing} />
      case "custom-player":
        return <CustomPlayerBlock block={block} isEditing={isEditing} />
      case "card":
        return <CardBlock block={block} isEditing={isEditing} />
      case "button":
        return <ButtonBlock block={block} isEditing={isEditing} />
      case "hero":
        return <HeroBlock block={block} isEditing={isEditing} />
      case "headline":
        return <HeadlineBlock block={block} isEditing={isEditing} />
      case "countdown":
        return <CountdownBlock block={block} isEditing={isEditing} />
      case "social-links":
        return <SocialLinksBlock block={block} isEditing={isEditing} />
      case "tour-dates":
        return <TourDatesBlock block={block} isEditing={isEditing} />
      case "video-background":
        return <VideoBackgroundBlock block={block} isEditing={isEditing} />
      case "gallery":
        return <GalleryBlock block={block} isEditing={isEditing} />
      case "marquee":
        return <MarqueeBlock block={block} isEditing={isEditing} />
      case "divider":
        return <DividerBlock block={block} isEditing={isEditing} />
      case "credits":
        return <CreditsBlock block={block} isEditing={isEditing} />
      case "press-quotes":
        return <PressQuotesBlock block={block} isEditing={isEditing} />
      case "stats":
        return <StatsBlock block={block} isEditing={isEditing} />
      case "discography":
        return <DiscographyBlock block={block} isEditing={isEditing} />
      case "bio-card":
        return <BioCardBlock block={block} isEditing={isEditing} />
      case "accordion":
        return <AccordionBlock block={block} isEditing={isEditing} />
      case "tabs":
        return <TabsBlock block={block} isEditing={isEditing} />
      case "merch-grid":
        return <MerchGridBlock block={block} isEditing={isEditing} />
      case "column":
        return (
          <ColumnBlock
            block={block}
            pageStyle={pageStyle}
            isEditing={isEditing}
            onSelectBlock={onSelect}
            selectedBlockId={selectedBlockId}
            onUpdateChildren={
              onUpdateChildren
                ? (children) => onUpdateChildren(block.id, children)
                : undefined
            }
            onAddChildBlock={
              onAddChildBlock
                ? (columnIndex, blockType) => onAddChildBlock(block.id, columnIndex, blockType)
                : undefined
            }
            onRemoveChildBlock={
              onRemoveChildBlock
                ? (childId) => onRemoveChildBlock(block.id, childId)
                : undefined
            }
            onUpdateChildProps={onUpdateProps}
          />
        )
      case "carousel":
        return (
          <CarouselBlock
            block={block}
            pageStyle={pageStyle}
            isEditing={isEditing}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelect}
            onUpdateSlides={
              onUpdateCarouselSlides
                ? (slides) => onUpdateCarouselSlides(block.id, slides)
                : undefined
            }
            onUpdateChildProps={onUpdateProps}
          />
        )
      default:
        return <div>Unknown block type</div>
    }
  })()

  if (!isEditing) {
    return content
  }

  // Don't wrap column/carousel blocks in selection container (they handle their own)
  if (block.type === "column" || block.type === "carousel") {
    return content
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative rounded-lg transition-all cursor-pointer",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "hover:ring-1 hover:ring-muted-foreground/30"
      )}
    >
      {content}
    </div>
  )
}
