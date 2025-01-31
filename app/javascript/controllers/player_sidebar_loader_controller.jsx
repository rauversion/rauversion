import { Controller } from "@hotwired/stimulus"
import React from "react"
import { createRoot } from "react-dom/client"
import PlayerSidebar from "../components/player_sidebar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet"
import { List } from "lucide-react"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    this.renderReactComponent()
  }

  renderReactComponent() {
    const root = createRoot(this.containerTarget)
    
    root.render(
      <Sheet>
        <SheetTrigger asChild>
          <button className="rounded-full p-2 hover:bg-accent">
            <List className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-default">
          <SheetHeader>
            <SheetTitle>Queue</SheetTitle>
            <SheetDescription>
              Your current playlist queue
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-120px)]">
            <PlayerSidebar />
          </div>
        </SheetContent>
      </Sheet>
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