import React, { useEffect, useRef, useState } from 'react'
import StarterKit from '@tiptap/starter-kit'
import { Editor } from '@tiptap/core'
import { Button } from "@/components/ui/button"
import {
  Wand2,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  List as BulletListIcon,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const getStarterKitConfig = (isPlain) => (
  isPlain
    ? {
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        dropcursor: false,
        gapcursor: false,
        hardBreak: false,
        horizontalRule: false,
        history: false,
      }
    : {
        heading: {
          levels: [1, 2, 3],
        },
        history: {
          depth: 10,
        },
      }
)

export default function SimpleEditor({
  value,
  onChange,
  plain = false,
  scope = 'default',
  aiPromptContext = 'default',
}) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [, setRenderTick] = useState(0)

  const editorRef = useRef(null)
  const editorElementRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const element = editorElementRef.current
    if (!element) return

    const editor = new Editor({
      element,
      extensions: [StarterKit.configure(getStarterKitConfig(plain))],
      content: value || '',
      editable: true,
      onUpdate: ({ editor: nextEditor }) => {
        onChangeRef.current?.(nextEditor.getHTML())
      },
      onSelectionUpdate: () => {
        setRenderTick((tick) => tick + 1)
      },
      onTransaction: () => {
        setRenderTick((tick) => tick + 1)
      },
    })

    editorRef.current = editor
    setRenderTick((tick) => tick + 1)

    return () => {
      editor.destroy()
      editorRef.current = null
    }
  }, [plain])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || value === undefined) return

    const nextContent = value || ''
    if (nextContent !== editor.getHTML()) {
      editor.commands.setContent(nextContent, false)
    }
  }, [value, plain])

  useEffect(() => {
    const editor = editorRef.current
    if (isEnhancing || !editor) return
    onChangeRef.current?.(editor.getHTML())
  }, [isEnhancing])

  const handleEnhanceWithAI = async (e) => {
    e.preventDefault()
    setIsEnhancing(true)

    try {
      const editor = editorRef.current
      if (!editor) return

      const selectedText = editor.state.selection.empty
        ? null
        : editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          )

      const textToEnhance = selectedText || value

      const promptWithContent = `
        ${aiPromptContext ? 'Context: ' + aiPromptContext : ''}
        ${aiPrompt}
      `

      const response = await fetch('/ai_enhancements/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          text: textToEnhance,
          prompt: promptWithContent,
          scope: scope,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (selectedText) {
          editor.chain().focus().deleteSelection().insertContent(data.enhanced_text).run()
        } else {
          editor.chain().focus().setContent(data.enhanced_text).run()
        }
        setAiDialogOpen(false)
        setAiPrompt('')
      } else {
        console.error('Enhancement failed:', data.error)
      }
    } catch (error) {
      console.error('Enhancement request failed:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const editor = editorRef.current

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4 border-b pb-4">
        <Button
          size="sm"
          variant={editor?.isActive('bold') ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleBold().run()
          }}
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('italic') ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleItalic().run()
          }}
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('bulletList') ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleBulletList().run()
          }}
        >
          <BulletListIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('orderedList') ? 'default' : 'outline'}
          disabled={!editor || plain}
          onClick={(e) => {
            e.preventDefault()
            editor?.chain().focus().toggleOrderedList().run()
          }}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!editor}
          onClick={(e) => {
            e.preventDefault()
            setAiDialogOpen(true)
          }}
        >
          <Wand2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-[100px] border rounded-md">
        <div
          ref={editorElementRef}
          className="prose dark:prose-invert max-w-none p-3 min-h-[100px] focus:outline-none"
        />
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enhance with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Input
                id="prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter your prompt..."
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleEnhanceWithAI} disabled={isEnhancing}>
                {isEnhancing ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Enhance'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
