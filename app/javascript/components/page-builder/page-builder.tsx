"use client"
import React from "react"
import { useState, useRef, useEffect, createContext, useContext } from "react"
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { BlockPalette } from "./block-palette"
import { EditorCanvas } from "./editor-canvas"
import { PropertyPanel } from "./property-panel"
import { useBlocks, BlocksProvider } from "./block-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PagePreview } from "./page-preview"
import { GripVertical, Eye, Edit2, Bug, Save, Code, Monitor, Tablet, Smartphone, Undo2, Redo2 } from "lucide-react"
import { useParams } from "react-router-dom"
import { post, put } from "@rails/request.js"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { v4 as uuidv4 } from "uuid"
import { getAllBlockTypes } from "./blocks/registry"
import { useToast } from "@/hooks/use-toast"

// Create a context for the page builder
interface PageBuilderContextType {
  selectedBlockId: string | null
  setSelectedBlockId: (id: string | null) => void
  pageBlockId: string | null
}

export const PageBuilderContext = createContext<PageBuilderContextType | undefined>(undefined)

// Hook to use the page builder context
export function usePageBuilder() {
  const context = useContext(PageBuilderContext)
  if (!context) {
    throw new Error("usePageBuilder must be used within a PageBuilderProvider")
  }
  return context
}

function PageBuilderContent() {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const params = useParams()
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [pageBlockId, setPageBlockId] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const { debug, setDebug, blocks, setBlocks, addBlock, moveBlock, undo, redo } = useBlocks()
  const [activeTab, setActiveTab] = useState("canvas")
  const [displayMode, setDisplayMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [activeDrag, setActiveDrag] = useState<any>(null)

  // Default panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(250)
  const [rightPanelWidth, setRightPanelWidth] = useState(300)

  // Refs for resize handling
  const leftResizeRef = useRef<HTMLDivElement>(null)
  const rightResizeRef = useRef<HTMLDivElement>(null)

  // Resize state
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  // Min and max widths for panels
  const MIN_PANEL_WIDTH = 200
  const MAX_PANEL_WIDTH = 500

  // Undo/Redo keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrl = isMac ? e.metaKey : e.ctrlKey
      if (ctrl && e.key === 'z') {
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  useEffect(() => {
    const handleSelectBlockEvent = (e: any) => {
      if (e.detail && e.detail.blockId) {
        setSelectedBlockId(e.detail.blockId)

        // Log selection in debug mode
        if (debug) {
          console.log(`Selected block via event: ${e.detail.blockId}`)
        }

        // Force a re-render of the property panel
        setTimeout(() => {
          const propertyPanel = document.querySelector("[data-property-panel]")
          if (propertyPanel) {
            propertyPanel.classList.add("updating")
            setTimeout(() => propertyPanel.classList.remove("updating"), 0)
          }
        }, 0)
      }
    }

    window.addEventListener("selectBlock", handleSelectBlockEvent)

    return () => {
      window.removeEventListener("selectBlock", handleSelectBlockEvent)
    }
  }, [debug])

  // Initialize the page block if it doesn't exist
  useEffect(() => {
    if (blocks.length === 0) {
      const newPageId = uuidv4()
      const pageBlock = {
        id: newPageId,
        type: "page" as const,
        properties: {
          width: "100%",
          maxWidth: "1200px",
          padding: 24,
          background: "#ffffff",
          textColor: "#000000",
          fontFamily: "system-ui, sans-serif",
          centered: true,
        },
        children: [],
        containers: [],
      }

      setBlocks([pageBlock])
      setPageBlockId(newPageId)
      setSelectedBlockId(newPageId)

      if (debug) {
        console.log("Created new page block:", pageBlock)
      }
    } else {
      const pageBlock = blocks.find((block) => block.type === "page")
      if (pageBlock) {
        setPageBlockId(pageBlock.id)
        if (!selectedBlockId) {
          setSelectedBlockId(pageBlock.id)
        }
      }
    }
  }, [blocks, debug, setBlocks, selectedBlockId, addBlock])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX
        if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
          setLeftPanelWidth(newWidth)
        }
      }

      if (isResizingRight) {
        const containerWidth = document.body.clientWidth
        const newWidth = containerWidth - e.clientX
        if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
          setRightPanelWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingLeft, isResizingRight])

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode)
    if (!isPreviewMode) {
      setSelectedBlockId(null)
    }
  }

  const exportBlocks = () => {
    const json = JSON.stringify(blocks, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "page-builder-blocks.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.DEBUG_RENDER = debug
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.DEBUG_RENDER
      }
    }
  }, [debug])

  const handleSelectBlock = (id: string | null) => {
    if (id !== selectedBlockId) {
      setSelectedBlockId(id)
      if (debug) {
        console.log(`Selected block via direct call: ${id}`)
      }
    }
  }

  // Helper to find a block by id in the blocks tree
  function findBlockById(blocksArr: any[], id: string): any {
    for (const block of blocksArr) {
      if (block.id === id) return block;
      if (block.children) {
        const found = findBlockById(block.children, id);
        if (found) return found;
      }
      if (block.containers) {
        for (const container of block.containers) {
          if (container.children) {
            const found = findBlockById(container.children, id);
            if (found) return found;
          }
        }
      }
    }
    return null;
  }

  // Helper to update a block's children array in the blocks state (returns a new array)
  function updateBlockChildren(blocksArr: any[], id: string, newChildren: any[]): any[] {
    return blocksArr.map((block) => {
      if (block.id === id) {
        return { ...block, children: newChildren };
      }
      if (block.children) {
        return { ...block, children: updateBlockChildren(block.children, id, newChildren) };
      }
      if (block.containers) {
        return {
          ...block,
          containers: block.containers.map((container: any) => ({
            ...container,
            children: container.children
              ? updateBlockChildren(container.children, id, newChildren)
              : container.children,
          })),
        };
      }
      return block;
    });
  }

  // --- DND-KIT onDragStart and onDragEnd logic ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDrag(event.active);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) return;

    const activeData = active.data?.current;
    const overData = over.data?.current;

    if (!activeData || !overData) return;

    // If dragging from palette, add a new block to the drop target (DroppableArea)
    if (activeData.fromPalette) {
      if (
        overData.type === "children" ||
        overData.type === "cell" ||
        overData.type === "tab"
      ) {
        const newBlockId = addBlock(activeData.type);
        moveBlock(newBlockId, overData.id, overData.type);
      }
      return;
    }

    // If sorting within the same container (SortableContext)
    if (
      activeData.containerId &&
      overData.containerId &&
      activeData.containerId === overData.containerId &&
      activeData.containerType === overData.containerType &&
      activeData.containerType === "children"
    ) {
      const parentBlock = findBlockById(blocks, activeData.containerId);
      if (parentBlock && parentBlock.children) {
        const oldIndex = parentBlock.children.findIndex((b: any) => b.id === activeData.id);
        const newIndex = parentBlock.children.findIndex((b: any) => b.id === overData.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newChildren = arrayMove(parentBlock.children, oldIndex, newIndex);
          const newBlocks = updateBlockChildren(blocks, parentBlock.id, newChildren);
          setBlocks(newBlocks);
        }
      }
      return;
    }

    // If dropped on a DroppableArea (container, page, or grid cell), move/add to that container
    if (
      overData.type === "children" ||
      overData.type === "cell" ||
      overData.type === "tab"
    ) {
      moveBlock(activeData.id, overData.id, overData.type);
      return;
    }
    // Otherwise, do nothing
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
     
        <PageBuilderContext.Provider value={{ selectedBlockId, setSelectedBlockId, pageBlockId }}>
          <div className="flex h-screen w-full flex-col overflow-hidden--">
            {/* Header with mode toggle */}
            <div className="flex items-center justify-between border-b bg-background p-4">
            <h1 className="text-2xl font-bold">Page Builder</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="debug-mode" checked={debug} onCheckedChange={setDebug} />
                <Label htmlFor="debug-mode" className="flex items-center gap-1">
                  <Bug size={16} />
                  Debug Mode
                </Label>
              </div>
              <Button onClick={undo} variant="outline" className="gap-2" title="Undo (Ctrl+Z)">
                <Undo2 size={16} />
                <span>Undo</span>
              </Button>
              <Button onClick={redo} variant="outline" className="gap-2" title="Redo (Ctrl+Shift+Z)">
                <Redo2 size={16} />
                <span>Redo</span>
              </Button>
              <Button onClick={exportBlocks} variant="outline" className="gap-2">
                <Save size={16} />
                <span>Export</span>
              </Button>
              <Button
                onClick={async () => {
                  if (!params.id) {
                    toast({
                      title: "No release id in URL",
                      description: "Cannot save without a release id.",
                      variant: "destructive"
                    })
                    return
                  }
                  setIsSaving(true)
                  try {
                    const response = await put(`/releases/${params.id}.json`, {
                      body: JSON.stringify({ 
                        release: { 
                          theme_schema: blocks 
                        } 
                      }),
                      responseKind: "json"
                    })
                    // @ts-ignore
                    if (response.ok) {
                      toast({
                        title: "Saved successfully!",
                        description: "Your page was saved to the release.",
                        variant: "default"
                      })
                    } else {
                      toast({
                        title: "Save failed",
                        description: "There was an error saving your page.",
                        variant: "destructive"
                      })
                    }
                  } catch (e) {
                    toast({
                      title: "Save failed",
                      description: "There was an error saving your page.",
                      variant: "destructive"
                    })
                  } finally {
                    setIsSaving(false)
                  }
                }}
                variant="default"
                className="gap-2"
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </Button>
              <Button onClick={togglePreviewMode} variant="outline" className="gap-2">
                {isPreviewMode ? (
                  <>
                    <Edit2 size={16} />
                    <span>Edit Mode</span>
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    <span>Preview Mode</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {isPreviewMode ? (
            // Preview Mode
            <PagePreview />
          ) : (
            // Edit Mode
            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Blocks */}
              <div className="border-r bg-muted/40 overflow-y-auto" style={{ width: `${leftPanelWidth}px` }}>
                <div className="p-4">
                  <h2 className="mb-4 text-lg font-semibold">Blocks</h2>
                  <BlockPalette />
                </div>
              </div>

              {/* Left Resize Handle */}
              <div
                ref={leftResizeRef}
                className="w-1 bg-border hover:bg-primary hover:w-1.5 cursor-col-resize transition-all flex items-center justify-center group"
                onMouseDown={() => setIsResizingLeft(true)}
              >
                <GripVertical size={12} className="opacity-0 group-hover:opacity-100 text-primary" />
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                  <div className="border-b px-6 py-2 flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="canvas">Canvas</TabsTrigger>
                      <TabsTrigger value="json">JSON</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        className={`p-2 rounded ${displayMode === "mobile" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                        title="Mobile"
                        onClick={() => setDisplayMode("mobile")}
                      >
                        <Smartphone size={18} />
                      </button>
                      <button
                        type="button"
                        className={`p-2 rounded ${displayMode === "tablet" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                        title="Tablet"
                        onClick={() => setDisplayMode("tablet")}
                      >
                        <Tablet size={18} />
                      </button>
                      <button
                        type="button"
                        className={`p-2 rounded ${displayMode === "desktop" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                        title="Desktop"
                        onClick={() => setDisplayMode("desktop")}
                      >
                        <Monitor size={18} />
                      </button>
                    </div>
                  </div>
                  <TabsContent value="canvas" className="flex-1 overflow-auto p-6">
                    <EditorCanvas
                      selectedBlockId={selectedBlockId}
                      setSelectedBlockId={handleSelectBlock}
                      displayMode={displayMode}
                    />
                  </TabsContent>
                  <TabsContent value="json" className="flex-1 overflow-auto p-6">
                    <div className="rounded-md border bg-muted p-4">
                      <h3 className="mb-2 text-sm font-medium flex items-center gap-2">
                        <Code size={16} />
                        Block Structure JSON
                      </h3>
                      <pre className="text-xs overflow-auto max-h-[calc(100vh-200px)] p-2 bg-background rounded">
                        {JSON.stringify(blocks, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Resize Handle */}
              <div
                ref={rightResizeRef}
                className="w-1 bg-border hover:bg-primary hover:w-1.5 cursor-col-resize transition-all flex items-center justify-center group"
                onMouseDown={() => setIsResizingRight(true)}
              >
                <GripVertical size={12} className="opacity-0 group-hover:opacity-100 text-primary" />
              </div>

              {/* Right Panel - Properties */}
              <div className="border-l bg-muted/40 overflow-y-auto" style={{ width: `${rightPanelWidth}px` }}>
                <div className="p-4">
                  <h2 className="mb-4 text-lg font-semibold">Properties</h2>
                  <PropertyPanel selectedBlockId={selectedBlockId} />
                </div>
              </div>
            </div>
          )}
        </div>
        <DragOverlay>
          {activeDrag ? (() => {
            const data = activeDrag.data?.current;
            if (!data) return null;
            if (data.fromPalette) {
              const blockTypes = (typeof getAllBlockTypes === "function") ? getAllBlockTypes() : [];
              const blockDef = blockTypes.find((b: any) => b.type === data.type);
              return (
                <div className="flex cursor-grabbing items-center gap-2 rounded-md border bg-background p-3 shadow-lg opacity-80">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {blockDef?.icon}
                  </div>
                  <span className="text-sm font-medium">{blockDef?.label || data.type}</span>
                </div>
              );
            } else {
              // Block ghost: render minimal preview
              return (
                <div className="opacity-80 pointer-events-none">
                  <div className="rounded-md border border-primary/50 bg-white/80 shadow-lg p-2 min-w-[120px]">
                    <span className="text-xs text-muted-foreground">{data.type}</span>
                  </div>
                </div>
              );
            }
          })() : null}
        </DragOverlay>
        </PageBuilderContext.Provider>
      
    </DndContext>
  )
}

export default function PageBuilder({ defaultBlocks }: { defaultBlocks?: any[] }) {
  return (
    <BlocksProvider initialBlocks={defaultBlocks || []}>
      <PageBuilderContent />
    </BlocksProvider>
  )
}
