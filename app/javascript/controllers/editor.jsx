import { Controller } from "@hotwired/stimulus";
import React from 'react';
import { createRoot } from 'react-dom/client';
import Dante, {
  defaultTheme, 
  darkTheme,
  ImageBlockConfig,
  CodeBlockConfig,
  DividerBlockConfig,
  PlaceholderBlockConfig,
  EmbedBlockConfig,
  VideoBlockConfig,
  GiphyBlockConfig,
  VideoRecorderBlockConfig,
  SpeechToTextBlockConfig,
} from 'dante3/package/esm';
import { DirectUpload } from "@rails/activestorage";

import { get, post, put, patch, destroy } from '@rails/request.js'

import {useDebounce} from '../hooks/use_debounce'
import { createDanteEditorProps } from '../lib/dante_editor_props'


export default class extends Controller {

  static targets = ["sidebar", "status", "wrapper"]

  connect() {
    const wrapper = this.element;
    const root = createRoot(this.wrapperTarget);

    root.render(
      <EditorComponent 
        upload={this.upload} 
        ctx={this}
        initialValue={JSON.parse(wrapper.dataset.field)}
        callback={this.updateContent}>
      </EditorComponent>
    );
  }

  upload(file, cb){
    if(!file) return
    const url = '/api/v1/direct_uploads'
    const upload = new DirectUpload(file, url)
  
    upload.create((error, blob) => {
      if (error) {
        // Handle the error
      } else {
        cb(blob)
      }
    })
  }

  async createArticle (body) {
    this.statusTarget.text = "saving" 
    const response = await post('/articles', { 
      responseKind: "turbo-stream", 
      body: { post: {body: body } } 
    })
    
    if (response.redirected) {
      Turbo.visit(response.response.url);
    }
  }
  
  async updateArticle (body) {
    this.statusTarget.innerHTML = "saving" 
    const id = this.element.dataset.id
    await put(`/articles/${id}`, { 
      responseKind: "turbo-stream", 
      body: {
        post: { body: body, id: id }
      } 
    })
  }

  updateContent(ctx, data) {
    ctx.updateArticle(data)
    // You will need to implement this method to handle the 
    // "update-content" event. This may involve making an AJAX 
    // request to your server with the updated content.
  }

  disconnect() {
    // Cleanup when the controller is disconnected
  }

  displaySidebar(){
    this.sidebarTarget.classList.toggle("hidden")
  }

  closeSidebar(){
    this.sidebarTarget.classList.add("hidden")
  }
}


function EditorComponent({callback, ctx, upload, initialValue}){
  const [value, setValue] = React.useState(initialValue)
  const debouncedValue = useDebounce(value, 500)
  const editorProps = React.useMemo(() => createDanteEditorProps(), [])
  
  // Fetch API (optional)
  React.useEffect(() => {
    console.log("kjjkjjj")
    callback(ctx, value)
  }, [debouncedValue])

  return (
      <Dante 
        theme={darkTheme}
        content={value}
        editorProps={editorProps}
        widgets={[
          ImageBlockConfig({
            options: {
              upload_handler: (file, ctx) => {
                upload(file, (blob)=>{
                  console.log(blob)
                  console.log(ctx)
                  ctx.updateAttributes({
                    url: blob.service_url
                  })
                })
              }
            }
          }),
          CodeBlockConfig(),
          DividerBlockConfig(),
          PlaceholderBlockConfig(),
          EmbedBlockConfig({
            options: {
              endpoint: "/oembed?url=",
              placeholder: "Paste a link to embed content from another site (e.g. Twitter) and press Enter"
            },
          }),
          VideoBlockConfig({
            options: {
              endpoint: "/oembed?url=",
              placeholder:
                "Paste a YouTube, Vine, Vimeo, or other video link, and press Enter",
              caption: "Type caption for embed (optional)",
            },
          }),
          GiphyBlockConfig(),
          VideoRecorderBlockConfig({
            options: {
              upload_handler: (file, ctx) => {
                console.log("UPLOADED VIDEO FILE!!!!", file)
                
                upload(file, (blob)=>{
                  console.log(blob)
                  console.log(ctx)
                  ctx.updateAttributes({
                    url: blob.service_url
                  })
                })
              }
            }
          }),
          SpeechToTextBlockConfig(),
        ]}
        onUpdate={(editor)=>{
          console.log(editor.getJSON())
          setValue(editor.getJSON())
          // this.pushEvent("update-content", {content: editor.getJSON() } )
      }}/>
  )
}
