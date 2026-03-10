import React from "react"
import { List } from "lucide-react"

import usePlayerQueueSheetStore from "@/stores/playerQueueSheetStore"
import PlayerSidebar from "@/components/player_sidebar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function PlayerQueueSheet({
  triggerClassName,
  contentClassName,
}) {
  const isOpen = usePlayerQueueSheetStore((state) => state.isOpen)
  const setOpen = usePlayerQueueSheetStore((state) => state.setOpen)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir fila de reproducción"
          title="Abrir fila de reproducción"
          className={cn("rounded-full p-2 hover:bg-accent", triggerClassName)}
        >
          <List size={20} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className={cn(
          "w-[400px] p-0 sm:w-[540px] bg-background text-foreground border-l border-border/70",
          contentClassName
        )}
      >
        <SheetHeader>
          <SheetTitle>Queue</SheetTitle>
          <SheetDescription>Your current playlist queue</SheetDescription>
        </SheetHeader>

        <div className="h-[calc(100vh-120px)]">
          <PlayerSidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}
