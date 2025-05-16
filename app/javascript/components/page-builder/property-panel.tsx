"use client"
import React from "react"

import { useState, useMemo, useEffect } from "react"
import { useBlocks } from "./block-context"
import { Button } from "@/components/ui/button"
import { Code, ChevronRight, Layers } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { getPropertyEditor } from "./blocks/registry"
import { usePageBuilder } from "./page-builder"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


interface PropertyPanelProps {
  selectedBlockId: string | null
}

export function PropertyPanel({ selectedBlockId }: PropertyPanelProps) {
  const { getBlock, updateBlockProperties, debug, blocks } = useBlocks()
  const [jsonView, setJsonView] = useState(false)
  const { setSelectedBlockId } = usePageBuilder()

  useEffect(() => {
    if (debug) {
      console.log(`PropertyPanel rendering with selectedBlockId: ${selectedBlockId}`)
      if (selectedBlockId) {
        const block = getBlock(selectedBlockId)
        console.log(`Block found:`, block ? `${block.type} (${block.id})` : "null")
      }
    }
  }, [selectedBlockId, debug, getBlock])

  // Get the block hierarchy (breadcrumbs) using useMemo
  const blockHierarchy = useMemo(() => {
    if (!selectedBlockId) return []

    const hierarchy: { id: string; type: string }[] = []

    // Helper function to find a block and its parents
    const findBlockAndParents = (blocks: any[], targetId: string, parents: { id: string; type: string }[] = []) => {
      for (const block of blocks) {
        // Check if this is the target block
        if (block.id === targetId) {
          return [...parents, { id: block.id, type: block.type }]
        }

        // Check in children
        if (block.children && block.children.length > 0) {
          const result = findBlockAndParents(block.children, targetId, [...parents, { id: block.id, type: block.type }])
          if (result) return result
        }

        // Check in containers
        if (block.containers && block.containers.length > 0) {
          for (const container of block.containers) {
            if (container.children && container.children.length > 0) {
              const result = findBlockAndParents(container.children, targetId, [
                ...parents,
                { id: block.id, type: block.type },
              ])
              if (result) return result
            }
          }
        }
      }
      return null
    }

    // Get all blocks and find the hierarchy
    const result = findBlockAndParents(blocks, selectedBlockId)

    if (result) {
      return result
    }

    // If not found in hierarchy but we have a selected block, return just this block
    const block = getBlock(selectedBlockId)
    if (block) {
      return [{ id: selectedBlockId, type: block.type }]
    }

    return []
  }, [selectedBlockId, blocks, getBlock])

  // Early return if no block is selected
  if (!selectedBlockId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
        <p>Select a block to edit its properties</p>
      </div>
    )
  }

  const block = getBlock(selectedBlockId)
  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
        <p>Block not found</p>
      </div>
    )
  }

  const handlePropertyChange = (property: string, value: any) => {
    if (debug) {
      console.log(`Changing property ${property} to:`, value)
      console.log(`For block: ${selectedBlockId}`)
    }
    updateBlockProperties(selectedBlockId, { [property]: value })
  }

  const renderJsonView = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">JSON Properties</h3>
          <Button variant="outline" size="sm" onClick={() => setJsonView(false)}>
            Back to Editor
          </Button>
        </div>
        <Textarea value={JSON.stringify(block.properties, null, 2)} rows={20} readOnly className="font-mono text-xs" />
      </div>
    )
  }

  // Check if this block has children or containers with blocks
  const hasChildren = block.children && block.children.length > 0
  const hasContainers =
    block.containers &&
    block.containers.length > 0 &&
    block.containers.some((container) => container.children && container.children.length > 0)
  const showChildrenSection = hasChildren || hasContainers

  return (
    <div className="space-y-6" data-property-panel>
      {/* Breadcrumb navigation */}
      {blockHierarchy.length > 1 && (
        <div className="flex items-center overflow-x-auto whitespace-nowrap pb-2 text-sm">
          {blockHierarchy.map((item, index) => (
            <div key={item.id} className="flex items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />}
              <Button
                variant="link"
                size="sm"
                className={`p-0 capitalize ${index === blockHierarchy.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}
                onClick={() => {
                  // Only make parent blocks clickable
                  if (index < blockHierarchy.length - 1) {
                    setSelectedBlockId(item.id)
                  }
                }}
              >
                {item.type}
                {debug && <span className="ml-1 text-xs opacity-50">({item.id.substring(0, 4)})</span>}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium capitalize">{block.type} Properties</h3>
        <Button variant="outline" size="icon" onClick={() => setJsonView(!jsonView)}>
          <Code size={16} />
        </Button>
      </div>

      {jsonView ? (
        renderJsonView()
      ) : (
        <>
          {/* Block Properties */}
          {getPropertyEditor(block.type, block.properties, handlePropertyChange)}

          {/* Children section */}
          {showChildrenSection && (
            <Accordion type="single" collapsible className="mt-6 border rounded-md">
              <AccordionItem value="children">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-2">
                    <Layers size={16} />
                    <span>Child Elements</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* Direct children */}
                  {hasChildren && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium mb-2">Direct Children</h4>
                      {block.children.map((child: any) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-2 rounded-md border hover:bg-muted cursor-pointer"
                          onClick={() => setSelectedBlockId(child.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="capitalize text-sm">{child.type}</span>
                            {debug && (
                              <span className="text-xs text-muted-foreground">({child.id.substring(0, 4)})</span>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Container children */}
                  {hasContainers && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium mb-2">Container Elements</h4>
                      {block.containers.map((container: any, index: number) => (
                        <div key={container.id} className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground p-2 border rounded cursor-pointer hover:bg-muted">
                            {container.type || "Container"} {index + 1} {container.title && `(${container.title})`}
                          </div>
                          {container.children && container.children.length > 0 ? (
                            container.children.map((childBlock: any) => (
                              <div
                                key={childBlock.id}
                                className="flex items-center justify-between p-2 rounded-md border hover:bg-muted cursor-pointer ml-2"
                                onClick={() => setSelectedBlockId(childBlock.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="capitalize text-sm">{childBlock.type}</span>
                                  {debug && (
                                    <span className="text-xs text-muted-foreground">
                                      ({childBlock.id.substring(0, 4)})
                                    </span>
                                  )}
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground" />
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground ml-2 p-2">No blocks in this container</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </>
      )}
    </div>
  )
}
