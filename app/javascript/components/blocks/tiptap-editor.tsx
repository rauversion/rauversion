"use client"

import React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import { cn } from "@/lib/utils"
import type { ProseSize } from "@/lib/blocks/types"
import {
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
} from "lucide-react"
import { useCallback, useEffect } from "react"

const proseSizeClasses: Record<ProseSize, string> = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
  xl: "prose-xl",
  "2xl": "prose-2xl",
}

interface TiptapEditorProps {
  content: string
  onUpdate: (content: string) => void
  alignment?: "left" | "center" | "right"
  onAlignmentChange?: (alignment: "left" | "center" | "right") => void
  proseSize?: ProseSize
  placeholder?: string
}

export function TiptapEditor({
  content,
  onUpdate,
  alignment = "left",
  onAlignmentChange,
  proseSize = "base",
  placeholder = "Escribe aqui...",
}: TiptapEditorProps) {
  const proseSizeClass = proseSizeClasses[proseSize]
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[60px] p-3",
          proseSizeClass
        ),
      },
    },
  })

  useEffect(() => {
    if (editor && alignment) {
      editor.chain().focus().setTextAlign(alignment).run()
    }
  }, [editor, alignment])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="relative rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("bold") && "bg-muted text-primary"
            )}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("italic") && "bg-muted text-primary"
            )}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("strike") && "bg-muted text-primary"
            )}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("heading", { level: 1 }) && "bg-muted text-primary"
            )}
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("heading", { level: 2 }) && "bg-muted text-primary"
            )}
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("heading", { level: 3 }) && "bg-muted text-primary"
            )}
          >
            <Heading3 className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("codeBlock") && "bg-muted text-primary"
            )}
            title="Bloque de codigo"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("blockquote") && "bg-muted text-primary"
            )}
            title="Cita"
          >
            <Quote className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("bulletList") && "bg-muted text-primary"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("orderedList") && "bg-muted text-primary"
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => {
              editor.chain().focus().setTextAlign("left").run()
              onAlignmentChange?.("left")
            }}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "left" }) && "bg-muted text-primary"
            )}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              editor.chain().focus().setTextAlign("center").run()
              onAlignmentChange?.("center")
            }}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "center" }) && "bg-muted text-primary"
            )}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              editor.chain().focus().setTextAlign("right").run()
              onAlignmentChange?.("right")
            }}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive({ textAlign: "right" }) && "bg-muted text-primary"
            )}
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={setLink}
            className={cn(
              "p-1.5 rounded hover:bg-muted transition-colors",
              editor.isActive("link") && "bg-muted text-primary"
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
