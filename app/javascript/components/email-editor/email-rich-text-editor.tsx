"use client"

import React, { useCallback, useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { EmailAlign, EmailTextSize } from "@/lib/email-editor/types"

const sizeClasses: Record<EmailTextSize, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
}

interface EmailRichTextEditorProps {
  content: string
  size?: EmailTextSize
  alignment?: EmailAlign
  placeholder?: string
  onUpdate: (content: string) => void
  onAlignmentChange?: (alignment: EmailAlign) => void
}

export function EmailRichTextEditor({
  content,
  size = "base",
  alignment = "left",
  placeholder = "Escribe aquí...",
  onUpdate,
  onAlignmentChange,
}: EmailRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onUpdate(nextEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[140px] rounded-b-lg border-0 px-4 py-3 focus:outline-none",
          sizeClasses[size]
        ),
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor) return
    editor.chain().focus().setTextAlign(alignment).run()
  }, [alignment, editor])

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

  if (!editor) return null

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("bold") && "bg-muted text-primary")}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("italic") && "bg-muted text-primary")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("heading", { level: 1 }) && "bg-muted text-primary")}
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("heading", { level: 2 }) && "bg-muted text-primary")}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("heading", { level: 3 }) && "bg-muted text-primary")}
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("bulletList") && "bg-muted text-primary")}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("orderedList") && "bg-muted text-primary")}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("left").run()
            onAlignmentChange?.("left")
          }}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive({ textAlign: "left" }) && "bg-muted text-primary")}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("center").run()
            onAlignmentChange?.("center")
          }}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive({ textAlign: "center" }) && "bg-muted text-primary")}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().setTextAlign("right").run()
            onAlignmentChange?.("right")
          }}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive({ textAlign: "right" }) && "bg-muted text-primary")}
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={setLink}
          className={cn("rounded p-1.5 hover:bg-muted", editor.isActive("link") && "bg-muted text-primary")}
          title="Insertar link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
      {!content && <p className="px-4 pb-3 text-sm text-muted-foreground">{placeholder}</p>}
    </div>
  )
}
