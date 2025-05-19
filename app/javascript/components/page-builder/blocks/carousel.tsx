"use client"
import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, CircleIcon, SlidersHorizontal, Plus, Trash2 } from "lucide-react"
import type { Block, BlockDefinition, BlockRendererProps, ChildContainer, PropertyEditorProps } from "./types"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBlocks } from "../block-context"
import { BlockRenderer } from "../block-renderer"
import { usePageBuilder } from "../page-builder"
import { DroppableArea } from "../droppable-area"
import { v4 as uuidv4 } from "uuid"

// Create a separate component for the property editor to properly manage hooks
function CarouselPropertyEditor({ properties, onChange }: PropertyEditorProps) {
  // Get slide count from properties
  const slideCount = properties.slideCount || 3
  const slideNames =
    properties.slideNames ||
    Array(slideCount)
      .fill("")
      .map((_, i) => `Slide ${i + 1}`)

  const handleAddSlide = useCallback(() => {
    const newSlideNames = [...slideNames, `Slide ${slideNames.length + 1}`]
    onChange("slideNames", newSlideNames)
    onChange("slideCount", slideCount + 1)
  }, [slideNames, slideCount, onChange])

  const handleRemoveSlide = useCallback(
    (index: number) => {
      if (slideCount <= 1) return // Don't remove the last slide

      const updatedNames = [...slideNames]
      updatedNames.splice(index, 1)
      onChange("slideNames", updatedNames)
      onChange("slideCount", slideCount - 1)
    },
    [slideNames, slideCount, onChange],
  )

  const handleSlideNameChange = useCallback(
    (index: number, name: string) => {
      const updatedNames = [...slideNames]
      updatedNames[index] = name
      onChange("slideNames", updatedNames)
    },
    [slideNames, onChange],
  )

  return (
    <div className="space-y-6">
      {/* General carousel settings */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="carousel-height">Height (px)</Label>
          <Input
            id="carousel-height"
            type="number"
            value={properties.height || 400}
            onChange={(e) => onChange("height", Number(e.target.value))}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="carousel-transition-speed">Transition Speed (ms)</Label>
            <span className="text-sm text-muted-foreground">{properties.transitionSpeed || 300}ms</span>
          </div>
          <Slider
            id="carousel-transition-speed"
            min={100}
            max={1000}
            step={100}
            value={[properties.transitionSpeed || 300]}
            onValueChange={([value]) => onChange("transitionSpeed", value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="carousel-autoplay"
            checked={properties.autoplay || false}
            onCheckedChange={(checked) => onChange("autoplay", checked)}
          />
          <Label htmlFor="carousel-autoplay">Autoplay</Label>
        </div>

        {properties.autoplay && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="carousel-autoplay-interval">Autoplay Interval (ms)</Label>
              <span className="text-sm text-muted-foreground">{properties.autoplayInterval || 5000}ms</span>
            </div>
            <Slider
              id="carousel-autoplay-interval"
              min={1000}
              max={10000}
              step={1000}
              value={[properties.autoplayInterval || 5000]}
              onValueChange={([value]) => onChange("autoplayInterval", value)}
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="carousel-show-arrows"
            checked={properties.showArrows !== false}
            onCheckedChange={(checked) => onChange("showArrows", checked)}
          />
          <Label htmlFor="carousel-show-arrows">Show Navigation Arrows</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="carousel-show-dots"
            checked={properties.showDots !== false}
            onCheckedChange={(checked) => onChange("showDots", checked)}
          />
          <Label htmlFor="carousel-show-dots">Show Navigation Dots</Label>
        </div>

        <div>
          <Label htmlFor="carousel-border-radius">Border Radius</Label>
          <Select value={properties.borderRadius || "md"} onValueChange={(value) => onChange("borderRadius", value)}>
            <SelectTrigger id="carousel-border-radius">
              <SelectValue placeholder="Select border radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
              <SelectItem value="full">Full (Circular)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Slide management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Manage Slides</h3>
          <Button variant="outline" size="sm" onClick={handleAddSlide} className="flex items-center gap-1">
            <Plus size={14} />
            Add Slide
          </Button>
        </div>

        <div className="space-y-2">
          {slideNames.map((name, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => handleSlideNameChange(index, e.target.value)}
                placeholder={`Slide ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSlide(index)}
                disabled={slideCount <= 1}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper function to create slides
export const createSlides = (count: number, names?: string[]): ChildContainer[] => {
  return Array(count)
    .fill(null)
    .map((_, index) => ({
      id: uuidv4(),
      type: "slide",
      children: [],
      title: names?.[index] || `Slide ${index + 1}`,
    }))
}

export const carouselBlock: BlockDefinition = {
  type: "carousel",
  label: "Carousel",
  icon: <SlidersHorizontal size={16} />,
  defaultProperties: {
    height: 400,
    transitionSpeed: 300,
    autoplay: false,
    autoplayInterval: 5000,
    showArrows: true,
    showDots: true,
    borderRadius: "md",
    slideCount: 3,
    slideNames: ["Slide 1", "Slide 2", "Slide 3"],
  },

  // Add the getContainers function
  getContainers: (block: Block): ChildContainer[] => {
    const slideCount = block.properties.slideCount || 3
    const slideNames =
      block.properties.slideNames ||
      Array(slideCount)
        .fill("")
        .map((_, i) => `Slide ${i + 1}`)

    // If containers already exist and count matches, return them
    if (block.containers && block.containers.length === slideCount) {
      // Update titles if needed
      return block.containers.map((container, index) => ({
        ...container,
        title: slideNames[index] || `Slide ${index + 1}`,
      }))
    }

    // Otherwise create new containers
    return createSlides(slideCount, slideNames)
  },

  render: ({ block, isSelected, onSelect, isChild, parentId }: BlockRendererProps) => {
    const { debug, moveBlock, addBlock } = useBlocks()
    const { selectedBlockId } = usePageBuilder()
    const [activeSlide, setActiveSlide] = useState(0)
    const [isHovering, setIsHovering] = useState(false)
    const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Extract properties with defaults
    const height = block.properties.height || 400
    const transitionSpeed = block.properties.transitionSpeed || 300
    const autoplay = block.properties.autoplay || false
    const autoplayInterval = block.properties.autoplayInterval || 5000
    const showArrows = block.properties.showArrows !== false
    const showDots = block.properties.showDots !== false
    const borderRadius = block.properties.borderRadius || "md"

    // Get slide containers
    const slideContainers = block.containers || []

    // Handle autoplay
    useEffect(() => {
      if (autoplay && !isHovering && slideContainers.length > 1) {
        autoplayTimerRef.current = setInterval(() => {
          setActiveSlide((prev) => (prev + 1) % slideContainers.length)
        }, autoplayInterval)
      }

      return () => {
        if (autoplayTimerRef.current) {
          clearInterval(autoplayTimerRef.current)
        }
      }
    }, [autoplay, autoplayInterval, isHovering, slideContainers.length])

    // Handle navigation
    const goToSlide = useCallback(
      (index: number) => {
        if (index >= 0 && index < slideContainers.length) {
          setActiveSlide(index)
        }
      },
      [slideContainers.length],
    )

    const goToNextSlide = useCallback(() => {
      setActiveSlide((prev) => (prev + 1) % slideContainers.length)
    }, [slideContainers.length])

    const goToPrevSlide = useCallback(() => {
      setActiveSlide((prev) => (prev - 1 + slideContainers.length) % slideContainers.length)
    }, [slideContainers.length])

    // Handle drop on a slide
    const handleSlideDrop = (slideId: string, item: any) => {
      if (item.id) {
        // Move existing block
        moveBlock(item.id, slideId, "slide")
      } else if (item.type) {
        // Add new block from palette
        const newBlockId = addBlock(item.type)
        moveBlock(newBlockId, slideId, "slide")
      }
    }

    // Map borderRadius to Tailwind classes
    const borderRadiusClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    }

    return (
      <div
        className={cn(
          "w-full overflow-hidden-- kkkk",
          borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses] || "rounded-md",
          debug && "outline outline-2 outline-purple-500",
        )}
        // style={{ height: `${height}px` }}
        data-carousel-id={block.id}
        data-parent-id={parentId || "none"}
        onClick={(e) => {
          // Prevent click from propagating to parent elements
          e.stopPropagation()
          onSelect()
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {debug && (
          <div className="absolute top-0 left-0 z-50 text-xs text-white bg-black/50 p-1">Carousel ID: {block.id}</div>
        )}

        <div className="relative h-full w-full">
          {/* Slides */}
          <div className="relative h-full w-full">
            {slideContainers.map((container, index) => (
              <div
                key={container.id}
                className={cn(
                  "absolute-- top-0 left-0 h-full w-full transition-opacity",
                  index === activeSlide ? "opacity-100 z-10" : "absolute hidden opacity-0 z-0",
                )}
                style={{ transitionDuration: `${transitionSpeed}ms` }}
              >
                <DroppableArea
                  id={container.id}
                  type="cell"
                  className="h-full w-full p-4 border border-dashed"
                  onDrop={(item) => handleSlideDrop(container.id, item)}
                  isEmpty={!container.children || container.children.length === 0}
                  emptyContent={
                    debug ? `Slide ID: ${container.id} (${container.title})` : `Drop blocks here for ${container.title}`
                  }
                >
                  {container.children && container.children.length > 0 && (
                    <div className="flex flex-col gap-2 h-full">
                      {container.children.map((childBlock) => (
                        <BlockRenderer
                          key={childBlock.id}
                          block={childBlock}
                          isSelected={selectedBlockId === childBlock.id}
                          onSelect={() => {
                            // Directly set the selected block ID when a child is clicked
                            if (typeof window !== "undefined") {
                              const event = new CustomEvent("selectBlock", { detail: { blockId: childBlock.id } })
                              window.dispatchEvent(event)
                            }
                          }}
                          isChild={true}
                          parentId={block.id}
                          containerId={container.id}
                          containerType="cell"
                        />
                      ))}
                    </div>
                  )}
                </DroppableArea>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {showArrows && slideContainers.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 shadow-md"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevSlide()
                }}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 shadow-md"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNextSlide()
                }}
              >
                <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* Navigation Dots */}
          {showDots && slideContainers.length > 1 && (
            <div className="absolute bottom-2 left-0 z-20 flex w-full justify-center gap-1">
              {slideContainers.map((_, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-full p-0",
                    index === activeSlide ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    goToSlide(index)
                  }}
                >
                  <CircleIcon
                    size={index === activeSlide ? 10 : 8}
                    fill={index === activeSlide ? "currentColor" : "none"}
                  />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  },

  // Use the separate component for property editing to properly manage hooks
  propertyEditor: (props: PropertyEditorProps) => <CarouselPropertyEditor {...props} />,
}
