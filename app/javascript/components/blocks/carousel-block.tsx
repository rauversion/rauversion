"use client"

import React from "react"
import { useState, useCallback } from "react"
import { nanoid } from "nanoid"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type {
  CarouselBlock as CarouselBlockType,
  CarouselSlide,
  Block,
  BlockType,
} from "@/lib/blocks/types"
import { blockRegistry } from "@/lib/blocks/registry"
import { createDefaultBlock } from "@/lib/blocks/defaults"
import { BlockRenderer } from "./block-renderer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  GripVertical,
  Trash2,
  MoreVertical,
} from "lucide-react"

interface CarouselBlockProps {
  block: CarouselBlockType
  isEditing?: boolean
  selectedBlockId?: string | null
  onSelectBlock?: (id: string) => void
  onUpdateSlides?: (slides: CarouselSlide[]) => void
  onUpdateChildProps?: (blockId: string, props: Record<string, unknown>) => void
}

// Sortable item for blocks inside slides
function SortableSlideItem({
  block,
  isSelected,
  selectedBlockId,
  onSelect,
  onRemove,
  onUpdateProps,
}: {
  block: Block
  isSelected: boolean
  selectedBlockId?: string | null
  onSelect?: (id: string) => void
  onRemove?: (id: string) => void
  onUpdateProps?: (id: string, props: Record<string, unknown>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md border bg-background",
        isDragging && "opacity-50",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(block.id)
      }}
    >
      {/* Drag handle & actions */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 bg-muted rounded hover:bg-muted-foreground/20"
        >
          <GripVertical className="h-3 w-3" />
        </div>
      </div>

      <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="destructive"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.(block.id)
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <BlockRenderer
        block={block}
        isEditing={true}
        isSelected={isSelected}
        selectedBlockId={selectedBlockId}
        onSelect={onSelect}
        onUpdateProps={onUpdateProps}
      />
    </div>
  )
}

// Droppable slide container
function DroppableSlide({
  slide,
  slideIndex,
  isEditing,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onRemoveBlock,
  onReorderBlocks,
  onUpdateChildProps,
}: {
  slide: CarouselSlide
  slideIndex: number
  isEditing?: boolean
  selectedBlockId?: string | null
  onSelectBlock?: (id: string) => void
  onAddBlock?: (slideIndex: number, blockType: BlockType) => void
  onRemoveBlock?: (slideIndex: number, blockId: string) => void
  onReorderBlocks?: (slideIndex: number, blocks: Block[]) => void
  onUpdateChildProps?: (blockId: string, props: Record<string, unknown>) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = slide.blocks.findIndex((b) => b.id === active.id)
      const newIndex = slide.blocks.findIndex((b) => b.id === over.id)
      const newBlocks = arrayMove(slide.blocks, oldIndex, newIndex)
      onReorderBlocks?.(slideIndex, newBlocks)
    }
  }

  const contentBlocks = blockRegistry.filter(
    (b) => b.category === "content" || b.category === "media"
  )

  return (
    <div className="min-h-[120px] p-3 space-y-2">
      {isEditing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slide.blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {slide.blocks.map((block) => (
                <SortableSlideItem
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  selectedBlockId={selectedBlockId}
                  onSelect={onSelectBlock}
                  onRemove={(id) => onRemoveBlock?.(slideIndex, id)}
                  onUpdateProps={onUpdateChildProps}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div className="opacity-80 bg-background rounded border shadow-lg p-2">
                <BlockRenderer
                  block={slide.blocks.find((b) => b.id === activeId)!}
                  isEditing={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {slide.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} isEditing={false} />
          ))}
        </div>
      )}

      {isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir bloque
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            {contentBlocks.map((entry) => (
              <DropdownMenuItem
                key={entry.type}
                onClick={() => onAddBlock?.(slideIndex, entry.type)}
              >
                <entry.icon className="h-4 w-4 mr-2" />
                {entry.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isEditing && slide.blocks.length === 0 && (
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
          Slide vacio
        </div>
      )}
    </div>
  )
}

export function CarouselBlock({
  block,
  isEditing = false,
  selectedBlockId,
  onSelectBlock,
  onUpdateSlides,
  onUpdateChildProps,
}: CarouselBlockProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { slides, props } = block
  const { slidesPerView, showDots, showArrows, gap } = props

  const gapClass = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }[gap]

  const totalSlides = slides.length
  const maxSlide = Math.max(0, totalSlides - slidesPerView)

  const goToSlide = (index: number) => {
    if (props.loop) {
      setCurrentSlide(((index % totalSlides) + totalSlides) % totalSlides)
    } else {
      setCurrentSlide(Math.max(0, Math.min(index, maxSlide)))
    }
  }

  const nextSlide = () => goToSlide(currentSlide + 1)
  const prevSlide = () => goToSlide(currentSlide - 1)

  // Slide management for editing
  const addSlide = useCallback(() => {
    const newSlide: CarouselSlide = { id: nanoid(), blocks: [] }
    onUpdateSlides?.([...slides, newSlide])
  }, [slides, onUpdateSlides])

  const removeSlide = useCallback(
    (slideIndex: number) => {
      if (slides.length <= 1) return
      const newSlides = slides.filter((_, i) => i !== slideIndex)
      onUpdateSlides?.(newSlides)
      if (currentSlide >= newSlides.length) {
        setCurrentSlide(Math.max(0, newSlides.length - 1))
      }
    },
    [slides, currentSlide, onUpdateSlides]
  )

  const addBlockToSlide = useCallback(
    (slideIndex: number, blockType: BlockType) => {
      const newBlock = createDefaultBlock(blockType)
      const newSlides = slides.map((slide, i) =>
        i === slideIndex
          ? { ...slide, blocks: [...slide.blocks, newBlock] }
          : slide
      )
      onUpdateSlides?.(newSlides)
      onSelectBlock?.(newBlock.id)
    },
    [slides, onUpdateSlides, onSelectBlock]
  )

  const removeBlockFromSlide = useCallback(
    (slideIndex: number, blockId: string) => {
      const newSlides = slides.map((slide, i) =>
        i === slideIndex
          ? { ...slide, blocks: slide.blocks.filter((b) => b.id !== blockId) }
          : slide
      )
      onUpdateSlides?.(newSlides)
    },
    [slides, onUpdateSlides]
  )

  const reorderBlocksInSlide = useCallback(
    (slideIndex: number, newBlocks: Block[]) => {
      const newSlides = slides.map((slide, i) =>
        i === slideIndex ? { ...slide, blocks: newBlocks } : slide
      )
      onUpdateSlides?.(newSlides)
    },
    [slides, onUpdateSlides]
  )

  return (
    <div className="w-full">
      {/* Carousel container */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Slides wrapper */}
        <div
          className={cn("flex transition-transform duration-300", gapClass)}
          style={{
            transform: `translateX(-${currentSlide * (100 / slidesPerView)}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "flex-shrink-0 rounded-lg border bg-card",
                isEditing && "border-dashed"
              )}
              style={{ width: `calc(${100 / slidesPerView}% - ${gap === "sm" ? "0.5rem" : gap === "md" ? "1rem" : "1.5rem"} * ${(slidesPerView - 1) / slidesPerView})` }}
            >
              {isEditing && (
                <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    Slide {index + 1}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => removeSlide(index)}
                        disabled={slides.length <= 1}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar slide
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <DroppableSlide
                slide={slide}
                slideIndex={index}
                isEditing={isEditing}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
                onAddBlock={addBlockToSlide}
                onRemoveBlock={removeBlockFromSlide}
                onReorderBlocks={reorderBlocksInSlide}
                onUpdateChildProps={onUpdateChildProps}
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {showArrows && totalSlides > slidesPerView && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={prevSlide}
              disabled={!props.loop && currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={nextSlide}
              disabled={!props.loop && currentSlide >= maxSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Dots navigation */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === currentSlide
                  ? "bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}

      {/* Add slide button (editing mode) */}
      {isEditing && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm" onClick={addSlide}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir slide
          </Button>
        </div>
      )}
    </div>
  )
}
