import { Controller } from '@hotwired/stimulus';

import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { Editor } from '@tiptap/core'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import BulletList from "@tiptap/extension-bullet-list"
import History from '@tiptap/extension-history'
import { generateHTML, generateJSON } from '@tiptap/html'

export default class extends Controller {

  static targets = ["editor", "linkField", "linkWrapper", "textInput", "enhanceButton", "aiPromptWrapper", "aiPromptInput"]
  
  initialize(){
    
    const textInput = this.textInputTarget

    const richExtensions = [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Link,
      OrderedList, 
      ListItem,
      BulletList,
      History.configure({
        depth: 10,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      })
    ]

    const plainExtensions = [
      Document,
      Paragraph,
      Text,
    ]

    const extensions = this.element.dataset.plain ? 
      plainExtensions : richExtensions
  
    this.editor = new Editor({
      element: this.editorTarget,
      extensions: extensions,
        // all your other extensions
      onBeforeCreate({ editor }) {
        // Before the view is created.
      },
      onCreate({ editor }) {
        // The editor is ready.
        editor.commands.insertContent(textInput.value)
      },
      onUpdate({ editor }) {
        // The content has changed.
        console.log("updated", editor.state.toJSON())

        const html = generateHTML(editor.state.toJSON().doc, [
          Document,
          Paragraph,
          Text,
          Bold,
          Italic,
          Link,
          OrderedList, 
          ListItem,
          BulletList,
          History.configure({
            depth: 10,
          }),
          Heading.configure({
            levels: [1, 2, 3],
          }),
        ])

        console.log("HTML", html)
        textInput.value = html
      },
      onSelectionUpdate({ editor }) {
        // The selection has changed.
      },
      onTransaction({ editor, transaction }) {
        // The editor state has changed.
      },
      onFocus({ editor, event }) {
        // The editor is focused.
      },
      onBlur({ editor, event }) {
        // The editor isn’t focused anymore.
      },
      onDestroy() {
        // The editor is being destroyed.
      },
    })

    //this.editor.insertContent(textInput.value)
    //this.editor.commands.setContent(this.textInputTarget.value)
    window.ed = this.editor
  }

  toggleBold(e){
    e.preventDefault()
    this.editor.commands.toggleBold()
  }

  toggleItalic(e){
    e.preventDefault()
    this.editor.commands.toggleItalic()
  }

  toggleHeading(e) {
    // Check if the event is from a click or a specific key press on the button
    if (e.type === 'click') { // || (e.type === 'keydown' && e.key === 'Enter' && e.target.matches('[data-action="toggleHeading"]'))) {
      e.preventDefault();
      this.editor.commands.toggleHeading({ level: parseInt(e.currentTarget.dataset.level) });
    }
  }

  toggleOrderedList(e){
    e.preventDefault()
    this.editor.commands.toggleOrderedList()
  }

  toggleBulletList(e){
    e.preventDefault()
    this.editor.commands.toggleBulletList()
  }

  insert(e){
    e.preventDefault()
    this.editor.commands.insertContent(e.currentTarget.dataset.value)
  }

  setLink(e){
    e.preventDefault()
    this.editor.commands.toggleLink({ href: this.linkFieldTarget.value, target: '_blank' })
  }

  toggleLink(e){
    e.preventDefault()
    this.editor.commands.toggleLink({ href: this.linkFieldTarget.value, target: '_blank' })
  }

  openLinkPrompt(e){
    e.preventDefault()
    this.linkWrapperTarget.classList.toggle("hidden")
  }

  openAiPrompt(e) {
    this.aiPromptWrapperTarget.classList.remove("hidden")
  }

  closeAiPrompt(e) {
    this.aiPromptWrapperTarget.classList.add("hidden")
  }

  async enhanceWithAI(e) {
    const button = e.currentTarget
    const originalContent = button.innerHTML
    const prompt = this.aiPromptInputTarget.value
    
    // Get selected text or full content
    const selectedText = this.editor.state.selection.empty
      ? null
      : this.editor.state.doc.textBetween(
          this.editor.state.selection.from,
          this.editor.state.selection.to
        )
    
    const textToEnhance = selectedText || this.textInputTarget.value
    
    // Disable button and show loading state
    button.disabled = true
    button.innerHTML = '<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'

    try {
      const response = await fetch('/ai_enhancements/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          text: textToEnhance,
          prompt: prompt,
          scope: this.element.dataset.scope || 'default'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (selectedText) {
          // Replace only the selected text
          this.editor.commands.deleteSelection()
          this.editor.commands.insertContent(data.enhanced_text)
        } else {
          // Replace entire content
          this.textInputTarget.value = data.enhanced_text
          this.editor.commands.setContent(data.enhanced_text)
        }
        this.closeAiPrompt()
      } else {
        console.error('Enhancement failed:', data.error)
      }
    } catch (error) {
      console.error('Enhancement request failed:', error)
    } finally {
      // Restore button state
      button.disabled = false
      button.innerHTML = originalContent
    }
  }

  disconnect(){
    this.editor && this.editor.cleanup()
  }
}