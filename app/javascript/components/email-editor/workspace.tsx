"use client"

import React from "react"
import { Disc3, Redo2, Trash2, Undo2 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { clearEmailDocumentStorage } from "@/lib/email-editor/storage"
import { useEmailEditor } from "@/hooks/use-email-editor"
import { useSerializedHistory } from "@/hooks/use-serialized-history"
import type { EmailDocument } from "@/lib/email-editor/types"
import { EmailBlockPalette } from "./block-palette"
import { EmailCanvas } from "./canvas"
import { EmailDocumentSettings } from "./document-settings"
import { EmailBlockSettings } from "./block-settings"
import { EmailPreviewTab } from "./preview-tab"
import { EmailTestSendDialog } from "./test-send-dialog"

interface EmailEditorWorkspaceProps {
  storageNamespace?: string
  initialDocument?: EmailDocument | null
  deferInitialLoad?: boolean
  onPersistDocument?: (document: EmailDocument) => Promise<void>
  title?: string
  loadingMessage?: string
}

export function EmailEditorWorkspace({
  storageNamespace,
  initialDocument,
  deferInitialLoad = false,
  onPersistDocument,
  title = "Email Editor",
  loadingMessage = "Cargando editor de email...",
}: EmailEditorWorkspaceProps) {
  const {
    document,
    selectedBlock,
    selectedBlockId,
    activeTab,
    isLoaded,
    setSelectedBlockId,
    setActiveTab,
    addBlock,
    updateBlockProps,
    removeBlock,
    moveBlock,
    duplicateBlock,
    updateTheme,
    updateDocumentMeta,
    setDocumentDirect,
  } = useEmailEditor({
    storageNamespace,
    initialDocument,
    deferInitialLoad,
    defaultName: initialDocument?.name,
  })
  const { undo, redo, clearHistory, canUndo, canRedo } = useSerializedHistory(document, setDocumentDirect, isLoaded)
  const lastSavedRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (initialDocument === undefined) return
    lastSavedRef.current = initialDocument ? JSON.stringify(initialDocument) : null
  }, [initialDocument])

  React.useEffect(() => {
    if (!document || !onPersistDocument || !isLoaded) return

    const timeoutId = window.setTimeout(async () => {
      const serialized = JSON.stringify(document)
      if (serialized === lastSavedRef.current) return

      try {
        await onPersistDocument(document)
        lastSavedRef.current = serialized
      } catch (error) {
        console.error("Error saving email document", error)
      }
    }, 800)

    return () => window.clearTimeout(timeoutId)
  }, [document, isLoaded, onPersistDocument])

  if (!isLoaded || !document) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Disc3 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">MJML</p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <EmailTestSendDialog document={document} />
          <Button type="button" variant="ghost" size="icon" onClick={() => undo()} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => redo()} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              clearEmailDocumentStorage(storageNamespace)
              window.location.reload()
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Limpiar draft
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "editor" | "preview")} className="flex min-h-0 flex-1 flex-col">
        <div className="border-b bg-muted/20 px-4 py-2">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="m-0 flex min-h-0 flex-1">
          <aside className="w-72 shrink-0 border-r bg-card">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h2 className="mb-4 text-sm font-semibold">Bloques</h2>
                <EmailBlockPalette onAddBlock={addBlock} />
              </div>
            </ScrollArea>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <EmailCanvas
              blocks={document.blocks}
              theme={document.theme}
              selectedBlockId={selectedBlockId}
              onMoveBlock={moveBlock}
              onSelectBlock={setSelectedBlockId}
              onDuplicateBlock={duplicateBlock}
              onRemoveBlock={removeBlock}
            />
          </main>

          <aside className="w-96 shrink-0 border-l bg-card">
            <Tabs defaultValue="document" className="flex h-full flex-col">
              <div className="border-b px-4 py-2">
                <TabsList>
                  <TabsTrigger value="document">Email</TabsTrigger>
                  <TabsTrigger value="block">Bloque</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="document" className="m-0 flex-1 overflow-auto">
                <EmailDocumentSettings document={document} onUpdateMeta={updateDocumentMeta} onUpdateTheme={updateTheme} />
              </TabsContent>
              <TabsContent value="block" className="m-0 flex-1 overflow-auto">
                <EmailBlockSettings block={selectedBlock} onUpdate={updateBlockProps} onRemove={removeBlock} />
              </TabsContent>
            </Tabs>
          </aside>
        </TabsContent>

        <TabsContent value="preview" className="m-0 flex-1">
          <EmailPreviewTab document={document} isActive={activeTab === "preview"} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
