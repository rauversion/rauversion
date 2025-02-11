import React, { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import BulletList from "@tiptap/extension-bullet-list"
import History from '@tiptap/extension-history'
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const getExtensions = (isPlain) => {
  const baseExtensions = [
    Document,
    Paragraph,
    Text,
  ]

  if (isPlain) return baseExtensions

  return [
    ...baseExtensions,
    Bold,
    Italic,
    Link.configure({
      openOnClick: false,
    }),
    OrderedList,
    ListItem,
    BulletList,
    History.configure({
      depth: 10,
    }),
    Heading.configure({
      levels: [1, 2, 3],
    }),
  ]
}

export default function SimpleEditor({ 
  value, 
  onChange, 
  plain = false,
  scope = 'default'
}) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)

  const editor = useEditor({
    extensions: getExtensions(plain),
    content: value || '',
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  }, [])

  useEffect(() => {
    if (editor && value !== undefined) {
      const newContent = value || ''
      if (newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent, false)
      }
    }
  }, [value, editor])

  const handleSetLink = (e) => {
    e.preventDefault()
    editor?.chain().focus().toggleLink({ href: linkUrl, target: '_blank' }).run()
    setLinkDialogOpen(false)
    setLinkUrl('')
  }

  const handleEnhanceWithAI = async (e) => {
    e.preventDefault()
    setIsEnhancing(true)

    try {
      const selectedText = editor?.state.selection.empty
        ? null
        : editor?.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to
          )

      const textToEnhance = selectedText || value

      const response = await fetch('/ai_enhancements/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          text: textToEnhance,
          prompt: aiPrompt,
          scope: scope
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (selectedText) {
          editor?.chain().focus().deleteSelection().insertContent(data.enhanced_text).run()
        } else {
          editor?.chain().focus().setContent(data.enhanced_text).run()
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

  if (!editor) return null


  return (
    <div className="border rounded-lg p-4">
    
      <div className="flex items-center gap-2 mb-4 border-b pb-4">
        <Button
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          onClick={(e) => {
            e.preventDefault()

            editor.chain().focus().toggleBold().run()}
          }
        >
          Bold
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          onClick={(e) => {
            e.preventDefault()  
            editor.chain().focus().toggleItalic().run()}
          }
        >
          Italic
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          onClick={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          }
        >
          H1
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          onClick={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          }
        >
          H2
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleHeading({ level: 3 }).run()}
          }
        >
          H3
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          onClick={(e) => { 
            e.preventDefault()
            editor.chain().focus().toggleBulletList().run()}
          }
        >
          Bullet List
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleOrderedList().run()}
          }
        >
          Ordered List
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('link') ? 'default' : 'outline'}
          onClick={(e) => {
            e.preventDefault()
            setLinkDialogOpen(true)}
          }
        >
          Link
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            setAiDialogOpen(true)}
          }
        >
          <Wand2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-[100px] border rounded-md">
        <EditorContent editor={editor} className="prose dark:prose-invert max-w-none p-3" />
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetLink} className="space-y-4">
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Add Link</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enhance with AI</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnhanceWithAI} className="space-y-4">
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
              <Button type="submit" disabled={isEnhancing}>
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
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
