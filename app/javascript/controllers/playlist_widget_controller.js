import { Controller } from "@hotwired/stimulus"
import { createRoot } from "react-dom/client"
import React from "react"
import PlaylistComponent from "../components/playlist"

// Connects to data-controller="playlist-widget"
export default class extends Controller {
  static values = {
    playlistId: String
  }

  connect() {
    // Create root only if it hasn't been created yet
    if (!this.root) {
      this.root = createRoot(this.element)
      this.renderPlaylist()
    }
  }

  disconnect() {
    // Clean up React root on disconnect
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
  }


  renderPlaylist() {
    this.root.render(
      <React.StrictMode>
        <PlaylistComponent 
          playlistId={this.playlistIdValue}
        />
      </React.StrictMode>
    )
  }
}
