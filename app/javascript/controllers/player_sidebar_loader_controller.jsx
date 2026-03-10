import { Controller } from "@hotwired/stimulus"
import React from "react"
import { createRoot } from "react-dom/client"
import PlayerQueueSheet from "../components/player_queue_sheet"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.renderReactComponent()
  }

  renderReactComponent() {
    const root = createRoot(this.containerTarget)
    
    root.render(
      <PlayerQueueSheet />
    )
  }

  disconnect() {
    // Clean up React components
    if (this.containerTarget) {
      const root = createRoot(this.containerTarget)
      root.unmount()
    }
  }
}
