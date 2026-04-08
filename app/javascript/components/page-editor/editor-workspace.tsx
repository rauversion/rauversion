"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useEditor } from "@/hooks/use-editor"
import { useHistory } from "@/hooks/use-history"
import { BlockPalette } from "./components/block-palette"
import { EditorCanvas } from "./components/editor-canvas"
import { BlockSettings } from "./components/block-settings"
import { StyleSelector } from "./components/style-selector"
import { PreviewTab } from "./components/preview-tab"
import { TemplateManager } from "./components/template-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  PanelLeft,
  PanelRight,
  ChevronDown,
  Plus,
  FileText,
  Disc3,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react"
import { clearAllStorage, loadPages } from "@/lib/storage"
import type { Page } from "@/lib/blocks/types"
import { cn } from "@/lib/utils"
import type { EventSiteRecord } from "@/lib/event-sites"
import { EventSiteProvider } from "@/components/events/event-site-context"

interface EditorWorkspaceProps {
  storageNamespace?: string
  initialPages?: Page[] | null
  deferInitialLoad?: boolean
  defaultPageName?: string
  title?: string
  templateCategory: string
  previewUrl?: string | ((page: Page) => string | undefined)
  onPersistPages?: (pages: Page[]) => Promise<void>
  loadingMessage?: string
  notice?: React.ReactNode
  eventSite?: EventSiteRecord | null
}

export function EditorWorkspace({
  storageNamespace,
  initialPages,
  deferInitialLoad = false,
  defaultPageName,
  title = "Editor",
  templateCategory,
  previewUrl,
  onPersistPages,
  loadingMessage = "Cargando editor...",
  notice,
  eventSite,
}: EditorWorkspaceProps) {
  const {
    page,
    pages,
    selectedBlock,
    selectedBlockId,
    setSelectedBlockId,
    activeTab,
    setActiveTab,
    isLoaded,
    addBlock,
    updateBlockProps,
    removeBlock,
    moveBlock,
    duplicateBlock,
    updateStyle,
    updatePageName,
    createPage,
    switchPage,
    updateColumnChildren,
    addChildBlock,
    removeChildBlock,
    updateCarouselSlides,
    setPageDirect,
  } = useEditor({
    storageNamespace,
    initialPages,
    deferInitialLoad,
    defaultPageName,
  })

  const [showPalette, setShowPalette] = useState(true)
  const [showSettings, setShowSettings] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const lastSavedPagesRef = useRef<string | null>(null)

  const resolvedPreviewUrl = useMemo(() => {
    if (!page) return undefined
    return typeof previewUrl === "function" ? previewUrl(page) : previewUrl
  }, [page, previewUrl])

  const {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useHistory(page, setPageDirect, isLoaded)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  useEffect(() => {
    if (initialPages === undefined) return

    lastSavedPagesRef.current = JSON.stringify(initialPages || [])
  }, [initialPages])

  useEffect(() => {
    if (!onPersistPages || !isLoaded) return

    const timeoutId = window.setTimeout(async () => {
      const persistedPages = storageNamespace ? loadPages(storageNamespace) : pages
      const serializedPages = JSON.stringify(persistedPages)

      if (serializedPages === lastSavedPagesRef.current) return

      try {
        await onPersistPages(persistedPages)
        lastSavedPagesRef.current = serializedPages
      } catch (error) {
        console.error("Error saving editor pages:", error)
      }
    }, 800)

    return () => window.clearTimeout(timeoutId)
  }, [onPersistPages, isLoaded, pages, storageNamespace])

  if (!isLoaded || !page) {
    return (
      <EventSiteProvider value={eventSite}>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <Disc3 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{loadingMessage}</p>
          </div>
        </div>
      </EventSiteProvider>
    )
  }

  return (
    <EventSiteProvider value={eventSite}>
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between px-4 h-14 border-b bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Disc3 className="h-6 w-6 text-primary" />
              <span className="font-semibold hidden sm:inline">{title}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {isEditingName ? (
                    <Input
                      value={page.name}
                      onChange={(e) => updatePageName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setIsEditingName(false)
                      }}
                      className="h-6 w-32 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setIsEditingName(true)
                      }}
                      className="max-w-[150px] truncate"
                    >
                      {page.name}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {pages.map((editorPage) => (
                  <DropdownMenuItem
                    key={editorPage.id}
                    onClick={() => switchPage(editorPage.id)}
                    className={cn(editorPage.id === page.id && "bg-muted")}
                  >
                    {editorPage.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => createPage()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva pagina
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm("Esto borrara todas las paginas guardadas. ¿Continuar?")) {
                      clearAllStorage(storageNamespace)
                      window.location.reload()
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar storage
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border-r pr-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => undo()}
                disabled={!canUndo}
                title="Deshacer (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => redo()}
                disabled={!canRedo}
                title="Rehacer (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            <TemplateManager
              category={templateCategory}
              currentPage={page}
              onApplyTemplate={(newPage) => {
                clearHistory()
                setPageDirect(newPage)
              }}
              onClearHistory={clearHistory}
            />
          </div>
        </header>

        {notice}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "editor" | "preview")}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === "editor" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPalette(!showPalette)}
                    className={cn(!showPalette && "text-muted-foreground")}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(!showSettings && "text-muted-foreground")}
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <TabsContent value="editor" className="flex-1 m-0 flex flex-col min-h-0">
            <div className="flex-1 flex min-h-0">
              {showPalette && (
                <aside className="w-64 border-r bg-card shrink-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <h2 className="text-sm font-semibold mb-4">Bloques</h2>
                      <BlockPalette onAddBlock={addBlock} />
                    </div>
                  </ScrollArea>
                </aside>
              )}

              <main className="flex-1 flex flex-col min-w-0 bg-muted/20">
                <EditorCanvas
                  blocks={page.blocks}
                  selectedBlockId={selectedBlockId}
                  style={page.style}
                  onSelectBlock={setSelectedBlockId}
                  onMoveBlock={moveBlock}
                  onAddBlock={addBlock}
                  onDuplicateBlock={duplicateBlock}
                  onRemoveBlock={removeBlock}
                  onUpdateProps={updateBlockProps}
                  onUpdateColumnChildren={updateColumnChildren}
                  onAddChildBlock={addChildBlock}
                  onRemoveChildBlock={removeChildBlock}
                  onUpdateCarouselSlides={updateCarouselSlides}
                />

                <div className="p-4 border-t bg-card">
                  <StyleSelector style={page.style} onUpdate={updateStyle} />
                </div>
              </main>

              {showSettings && (
                <aside className="w-72 border-l bg-card shrink-0">
                  <BlockSettings
                    block={selectedBlock}
                    onUpdate={updateBlockProps}
                    onRemove={removeBlock}
                    onClose={() => setSelectedBlockId(null)}
                  />
                </aside>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0">
            <PreviewTab
              page={page}
              previewUrl={resolvedPreviewUrl}
            />
          </TabsContent>
        </Tabs>
      </div>
    </EventSiteProvider>
  )
}
